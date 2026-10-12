/**
 * Cervecería Bruma: recibe pedidos de reserva (pestaña «reservas») y
 * llamados al mesero (pestaña «llamados»).
 * Va pegado en la hoja «bar la bruma» (Extensiones → Apps Script).
 *
 * Solo agrega filas con estado «pendiente». Nunca marca una mesa como ocupada:
 * eso lo hace el dueño en la pestaña «mesas» cuando confirma.
 *
 * CORS: el frontend debe hacer POST con Content-Type «text/plain» (cuerpo JSON)
 * para evitar la petición previa (preflight), que Apps Script no responde.
 *   fetch(URL_EXEC, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
 *                     body: JSON.stringify(datos) })
 */

var HOJA_RESERVAS = 'reservas';
var COLUMNAS = ['creada', 'mesa', 'fecha', 'hora', 'personas', 'nombre', 'telefono', 'estado', 'nota', 'id'];
var DURACION_MIN = 120; // duración de una reserva confirmada, en minutos
var MAX_PENDIENTES_POR_TELEFONO = 3;
var ZONA = 'America/Santiago';
var HOJA_LLAMADOS = 'llamados';
var COLUMNAS_LLAMADOS = ['id', 'creada', 'mesa', 'estado', 'atendida'];
var VENTANA_LLAMADO_MS = 2 * 60 * 1000;
var FORMATO_FECHA = 'yyyy-MM-dd HH:mm:ss';

/**
 * GET sin parámetros            -> {ok:true}  (prueba de salud)
 * GET ?accion=llamado&id=ID     -> {ok, estado}  (el cliente consulta su llamado)
 * GET ?accion=llamados&clave=K  -> {ok, llamados:[{id, mesa, hora, estado}]}  (pantalla de la barra)
 * GET ?accion=reservas&clave=K  -> {ok, reservas:[{id, fila, creada, mesa, fecha, hora, personas, nombre, telefono, estado}]}
 * GET ?accion=carta&clave=K     -> {ok, carta:[{fila, nombre, precio, precio_oferta, disponible}]}
 * GET ?accion=happy&clave=K     -> {ok, happy:{dias, inicio, fin, activo}}
 * GET ?accion=ocupadas          -> {ok, ocupadas:[{mesa, fecha, desde, hasta}]}  (público, sin datos personales)
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var accion = texto_(p.accion);
  try {
    if (accion === '') return responder_({ ok: true });
    if (accion === 'llamado') return estadoLlamado_(texto_(p.id));
    if (accion === 'ocupadas') return listarOcupadas_();
    if (accion === 'carta') {
      if (!claveValida_(p.clave)) return responder_({ ok: false, error: 'clave_invalida' });
      return listarCarta_();
    }
    if (accion === 'happy') {
      if (!claveValida_(p.clave)) return responder_({ ok: false, error: 'clave_invalida' });
      return listarHappy_();
    }
    if (accion === 'reservas') {
      if (!claveValida_(p.clave)) return responder_({ ok: false, error: 'clave_invalida' });
      return listarReservas_();
    }
    if (accion === 'llamados') {
      if (!claveValida_(p.clave)) return responder_({ ok: false, error: 'clave_invalida' });
      return listarLlamados_();
    }
    return responder_({ ok: false, error: 'accion_invalida' });
  } catch (err) {
    return responder_({ ok: false, error: 'error_interno' });
  }
}

/**
 * POST sin accion o accion=reservar  -> reserva {ok, id}
 * POST accion=llamar {mesa, website} -> {ok, id}
 * POST accion=listo {id, clave}      -> {ok}
 * POST accion=confirmar|rechazar {id, clave} -> {ok}
 * POST accion=carta {clave, nombre, disponible?, precio?, precio_oferta?} -> {ok, fila}
 * POST accion=happy {clave, activo?, dias?, inicio?, fin?} -> {ok, happy}
 * POST accion=sin_reserva {mesa, personas?, minutos?, clave} -> {ok, id}
 */
function doPost(e) {
  var datos;
  try {
    datos = leerDatos_(e);
  } catch (err) {
    return responder_({ ok: false, error: 'datos_ilegibles' });
  }
  var accion = texto_(datos.accion) || 'reservar';
  if (accion === 'llamar') return llamar_(datos);
  if (accion === 'listo') return marcarListo_(datos);
  if (accion === 'confirmar') return cambiarEstadoReserva_(datos, 'confirmada');
  if (accion === 'rechazar') return cambiarEstadoReserva_(datos, 'rechazada');
  if (accion === 'sin_reserva') return sinReserva_(datos);
  if (accion === 'carta') return cambiarCarta_(datos);
  if (accion === 'happy') return cambiarHappy_(datos);
  if (accion !== 'reservar') return responder_({ ok: false, error: 'accion_invalida' });
  return reservar_(datos);
}

function reservar_(datos) {
  // Trampa para robots: el campo «website» va oculto en el formulario.
  if (texto_(datos.website) !== '') {
    return responder_({ ok: false, error: 'rechazada' });
  }

  var r = validar_(datos);
  if (r.error) {
    return responder_({ ok: false, error: r.error });
  }

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return responder_({ ok: false, error: 'ocupado_reintenta' });
  }
  try {
    var hoja = obtenerHoja_();
    if (contarPendientes_(hoja, r.telefono) >= MAX_PENDIENTES_POR_TELEFONO) {
      return responder_({ ok: false, error: 'demasiadas_pendientes' });
    }
    var creada = Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd HH:mm:ss');
    var fila = hoja.getLastRow() + 1;
    asegurarIds_(hoja);
    var id = idCorto_();
    var valores = [[creada, r.mesa, r.fecha, r.hora, r.personas, r.nombre, r.telefono, 'pendiente', '', id]];
    // Formato texto para que Sheets no convierta fecha, hora ni teléfono.
    hoja.getRange(fila, 1, 1, 7).setNumberFormat('@');
    hoja.getRange(fila, 10, 1, 1).setNumberFormat('@');
    hoja.getRange(fila, 1, 1, COLUMNAS.length).setValues(valores);
    SpreadsheetApp.flush();
    return responder_({ ok: true, id: id });
  } catch (err) {
    return responder_({ ok: false, error: 'error_interno' });
  } finally {
    lock.releaseLock();
  }
}

function leerDatos_(e) {
  var datos = {};
  if (e && e.parameter) {
    for (var k in e.parameter) datos[k] = e.parameter[k];
  }
  if (e && e.postData && e.postData.contents) {
    var tipo = String(e.postData.type || '');
    var cuerpo = e.postData.contents;
    if (tipo.indexOf('application/x-www-form-urlencoded') === -1 && /^\s*\{/.test(cuerpo)) {
      var json = JSON.parse(cuerpo);
      for (var j in json) datos[j] = json[j];
    }
  }
  return datos;
}

function texto_(v) {
  return v === undefined || v === null ? '' : String(v).trim();
}

function validar_(d) {
  var mesa = texto_(d.mesa);
  var fecha = texto_(d.fecha);
  var hora = texto_(d.hora);
  var personasTxt = texto_(d.personas);
  var nombre = texto_(d.nombre);
  var telefono = texto_(d.telefono).replace(/[\s().-]/g, '');

  if (!mesa || !fecha || !hora || !personasTxt || !nombre || !telefono) {
    return { error: 'faltan_datos' };
  }
  if (!/^\d{1,3}$/.test(mesa)) return { error: 'mesa_invalida' };

  var mf = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fecha);
  if (!mf) return { error: 'fecha_invalida' };
  var f = new Date(Number(mf[1]), Number(mf[2]) - 1, Number(mf[3]));
  if (f.getFullYear() !== Number(mf[1]) || f.getMonth() !== Number(mf[2]) - 1 || f.getDate() !== Number(mf[3])) {
    return { error: 'fecha_invalida' };
  }
  var hoy = Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd');
  if (fecha < hoy) return { error: 'fecha_pasada' };

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hora)) return { error: 'hora_invalida' };

  if (!/^\d{1,2}$/.test(personasTxt)) return { error: 'personas_invalidas' };
  var personas = Number(personasTxt);
  if (personas < 1 || personas > 20) return { error: 'personas_invalidas' };

  if (nombre.length > 80) return { error: 'nombre_invalido' };
  if (!/^\+?\d{8,15}$/.test(telefono)) return { error: 'telefono_invalido' };

  // Evita que una celda se interprete como fórmula.
  if (/^[=+\-@]/.test(nombre)) nombre = "'" + nombre;

  return { mesa: mesa, fecha: fecha, hora: hora, personas: personas, nombre: nombre, telefono: telefono };
}

function obtenerHoja_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(HOJA_RESERVAS);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA_RESERVAS);
    hoja.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function contarPendientes_(hoja, telefono) {
  var ultima = hoja.getLastRow();
  if (ultima < 2) return 0;
  var datos = hoja.getRange(2, 7, ultima - 1, 2).getValues(); // telefono, estado
  var n = 0;
  for (var i = 0; i < datos.length; i++) {
    var tel = String(datos[i][0]).replace(/[\s().'-]/g, '');
    if (tel === telefono && String(datos[i][1]).trim().toLowerCase() === 'pendiente') n++;
  }
  return n;
}

// ---------- Llamar al mesero ----------

function claveValida_(clave) {
  var guardada = PropertiesService.getScriptProperties().getProperty('CLAVE_BARRA');
  return !!guardada && texto_(clave) === String(guardada);
}

function hojaLlamados_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(HOJA_LLAMADOS);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA_LLAMADOS);
    hoja.getRange(1, 1, 1, COLUMNAS_LLAMADOS.length).setValues([COLUMNAS_LLAMADOS]).setFontWeight('bold');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function filasLlamados_(hoja) {
  var ultima = hoja.getLastRow();
  if (ultima < 2) return [];
  return hoja.getRange(2, 1, ultima - 1, COLUMNAS_LLAMADOS.length).getValues();
}

function textoFecha_(v) {
  return v instanceof Date ? Utilities.formatDate(v, ZONA, FORMATO_FECHA) : String(v);
}

function idCorto_() {
  var letras = 'abcdefghijkmnpqrstuvwxyz23456789';
  var id = '';
  for (var i = 0; i < 8; i++) id += letras.charAt(Math.floor(Math.random() * letras.length));
  return id;
}

function llamar_(datos) {
  if (texto_(datos.website) !== '') return responder_({ ok: false, error: 'rechazada' });
  var mesa = texto_(datos.mesa);
  if (!/^\d{1,3}$/.test(mesa)) return responder_({ ok: false, error: 'mesa_invalida' });

  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return responder_({ ok: false, error: 'ocupado_reintenta' });
  }
  try {
    var hoja = hojaLlamados_();
    var ahora = new Date();
    // «creada» se guarda como texto en hora de Chile, así que se compara como texto.
    var limite = Utilities.formatDate(new Date(ahora.getTime() - VENTANA_LLAMADO_MS), ZONA, FORMATO_FECHA);
    var filas = filasLlamados_(hoja);
    for (var i = filas.length - 1; i >= 0; i--) {
      var f = filas[i];
      if (String(f[2]).trim() === mesa && String(f[3]).trim().toLowerCase() === 'pendiente' &&
          textoFecha_(f[1]) >= limite) {
        return responder_({ ok: true, id: String(f[0]) });
      }
    }
    var id = idCorto_();
    var fila = hoja.getLastRow() + 1;
    hoja.getRange(fila, 1, 1, 5).setNumberFormat('@');
    hoja.getRange(fila, 1, 1, 5).setValues([[id, Utilities.formatDate(ahora, ZONA, FORMATO_FECHA), mesa, 'pendiente', '']]);
    SpreadsheetApp.flush();
    return responder_({ ok: true, id: id });
  } catch (err) {
    return responder_({ ok: false, error: 'error_interno' });
  } finally {
    lock.releaseLock();
  }
}

function marcarListo_(datos) {
  if (!claveValida_(datos.clave)) return responder_({ ok: false, error: 'clave_invalida' });
  var id = texto_(datos.id);
  if (!id) return responder_({ ok: false, error: 'faltan_datos' });
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return responder_({ ok: false, error: 'ocupado_reintenta' });
  }
  try {
    var hoja = hojaLlamados_();
    var filas = filasLlamados_(hoja);
    for (var i = 0; i < filas.length; i++) {
      if (String(filas[i][0]) === id) {
        hoja.getRange(i + 2, 4, 1, 2).setValues([['listo', Utilities.formatDate(new Date(), ZONA, FORMATO_FECHA)]]);
        SpreadsheetApp.flush();
        return responder_({ ok: true });
      }
    }
    return responder_({ ok: false, error: 'no_existe' });
  } catch (err) {
    return responder_({ ok: false, error: 'error_interno' });
  } finally {
    lock.releaseLock();
  }
}

function estadoLlamado_(id) {
  if (!id) return responder_({ ok: false, error: 'faltan_datos' });
  var filas = filasLlamados_(hojaLlamados_());
  for (var i = 0; i < filas.length; i++) {
    if (String(filas[i][0]) === id) {
      return responder_({ ok: true, estado: String(filas[i][3]).trim().toLowerCase() });
    }
  }
  return responder_({ ok: false, error: 'no_existe' });
}

function listarLlamados_() {
  var filas = filasLlamados_(hojaLlamados_());
  var lista = [];
  for (var i = 0; i < filas.length; i++) {
    var f = filas[i];
    if (String(f[3]).trim().toLowerCase() !== 'pendiente') continue;
    lista.push({ id: String(f[0]), mesa: String(f[2]), hora: textoFecha_(f[1]).slice(11, 16), estado: 'pendiente' });
  }
  return responder_({ ok: true, llamados: lista });
}

// ---------- Administración de reservas (personal, con CLAVE_BARRA) ----------

// Cada reserva tiene un «id» en la columna J (después de «nota»).
// Las filas antiguas sin id reciben uno la primera vez que se listan.
function asegurarIds_(hoja) {
  var col = COLUMNAS.length; // columna «id»
  if (String(hoja.getRange(1, col, 1, 1).getValues()[0][0]) !== 'id') {
    hoja.getRange(1, col, 1, 1).setValues([['id']]);
  }
  var ultima = hoja.getLastRow();
  if (ultima < 2) return [];
  var filas = hoja.getRange(2, 1, ultima - 1, col).getValues();
  for (var i = 0; i < filas.length; i++) {
    var vacia = filas[i].slice(0, col - 1).join('') === '';
    if (!vacia && texto_(filas[i][col - 1]) === '') {
      var id = idCorto_();
      hoja.getRange(i + 2, col, 1, 1).setNumberFormat('@');
      hoja.getRange(i + 2, col, 1, 1).setValues([[id]]);
      filas[i][col - 1] = id;
    }
  }
  return filas;
}

function fechaTexto_(v) {
  return v instanceof Date ? Utilities.formatDate(v, ZONA, 'yyyy-MM-dd') : texto_(v);
}

function horaTexto_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, ZONA, 'HH:mm');
  var t = texto_(v);
  var m = /^(\d{1,2}):(\d{2})/.exec(t);
  return m ? ('0' + m[1]).slice(-2) + ':' + m[2] : t;
}

function sumarMinutos_(hora, minutos) {
  var m = /^(\d{2}):(\d{2})$/.exec(hora);
  if (!m) return '';
  var total = (Number(m[1]) * 60 + Number(m[2]) + minutos) % (24 * 60);
  return ('0' + Math.floor(total / 60)).slice(-2) + ':' + ('0' + (total % 60)).slice(-2);
}

// «minutos=90» en la nota cambia la duración (lo usa «sin_reserva»).
function duracionDe_(nota) {
  var m = /minutos=(\d{1,4})/.exec(texto_(nota));
  return m ? Number(m[1]) : DURACION_MIN;
}

function conLock_(fn) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return responder_({ ok: false, error: 'ocupado_reintenta' });
  }
  try {
    return fn();
  } catch (err) {
    return responder_({ ok: false, error: 'error_interno' });
  } finally {
    lock.releaseLock();
  }
}

function aReserva_(f, i) {
  return {
    id: texto_(f[9]), fila: i + 2, creada: textoFecha_(f[0]), mesa: texto_(f[1]),
    fecha: fechaTexto_(f[2]), hora: horaTexto_(f[3]), personas: texto_(f[4]),
    nombre: texto_(f[5]), telefono: texto_(f[6]), estado: texto_(f[7]).toLowerCase()
  };
}

function ordenarPorFecha_(a, b) {
  var x = a.fecha + ' ' + a.hora, y = b.fecha + ' ' + b.hora;
  return x < y ? -1 : x > y ? 1 : 0;
}

function listarReservas_() {
  return conLock_(function () {
    var filas = asegurarIds_(obtenerHoja_());
    var hoy = Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd');
    var lista = [];
    for (var i = 0; i < filas.length; i++) {
      var r = aReserva_(filas[i], i);
      if (r.estado === 'pendiente' || (r.estado === 'confirmada' && r.fecha >= hoy)) lista.push(r);
    }
    lista.sort(ordenarPorFecha_);
    return responder_({ ok: true, reservas: lista });
  });
}

function cambiarEstadoReserva_(datos, estado) {
  if (!claveValida_(datos.clave)) return responder_({ ok: false, error: 'clave_invalida' });
  var id = texto_(datos.id);
  if (!id) return responder_({ ok: false, error: 'faltan_datos' });
  return conLock_(function () {
    var hoja = obtenerHoja_();
    var filas = asegurarIds_(hoja);
    for (var i = 0; i < filas.length; i++) {
      if (texto_(filas[i][9]) === id) {
        hoja.getRange(i + 2, 8, 1, 1).setValues([[estado]]);
        SpreadsheetApp.flush();
        return responder_({ ok: true });
      }
    }
    return responder_({ ok: false, error: 'no_existe' });
  });
}

function sinReserva_(datos) {
  if (!claveValida_(datos.clave)) return responder_({ ok: false, error: 'clave_invalida' });
  var mesa = texto_(datos.mesa);
  if (!/^\d{1,3}$/.test(mesa)) return responder_({ ok: false, error: 'mesa_invalida' });
  var personas = texto_(datos.personas);
  if (personas !== '' && (!/^\d{1,2}$/.test(personas) || Number(personas) < 1 || Number(personas) > 20)) {
    return responder_({ ok: false, error: 'personas_invalidas' });
  }
  var minutosTxt = texto_(datos.minutos);
  var minutos = minutosTxt === '' ? DURACION_MIN : Number(minutosTxt);
  if (!/^\d{1,4}$/.test(minutosTxt || '0') || minutos < 1 || minutos > 720) {
    return responder_({ ok: false, error: 'minutos_invalidos' });
  }
  return conLock_(function () {
    var hoja = obtenerHoja_();
    asegurarIds_(hoja);
    var ahora = new Date();
    var id = idCorto_();
    var fila = hoja.getLastRow() + 1;
    hoja.getRange(fila, 1, 1, COLUMNAS.length).setNumberFormat('@');
    hoja.getRange(fila, 1, 1, COLUMNAS.length).setValues([[
      Utilities.formatDate(ahora, ZONA, FORMATO_FECHA), mesa,
      Utilities.formatDate(ahora, ZONA, 'yyyy-MM-dd'), Utilities.formatDate(ahora, ZONA, 'HH:mm'),
      personas, 'Sin reserva', '', 'confirmada', 'minutos=' + minutos, id
    ]]);
    SpreadsheetApp.flush();
    return responder_({ ok: true, id: id });
  });
}

// Público: solo mesa y horario, nunca nombres ni teléfonos.
function listarOcupadas_() {
  var hoja = obtenerHoja_();
  var ultima = hoja.getLastRow();
  var lista = [];
  if (ultima >= 2) {
    var filas = hoja.getRange(2, 1, ultima - 1, COLUMNAS.length).getValues();
    var hoy = Utilities.formatDate(new Date(), ZONA, 'yyyy-MM-dd');
    for (var i = 0; i < filas.length; i++) {
      var f = filas[i];
      if (texto_(f[7]).toLowerCase() !== 'confirmada') continue;
      var fecha = fechaTexto_(f[2]);
      if (fecha < hoy) continue;
      var desde = horaTexto_(f[3]);
      lista.push({ mesa: texto_(f[1]), fecha: fecha, desde: desde, hasta: sumarMinutos_(desde, duracionDe_(f[8])) });
    }
  }
  lista.sort(function (a, b) { return ordenarPorFecha_({ fecha: a.fecha, hora: a.desde }, { fecha: b.fecha, hora: b.desde }); });
  return responder_({ ok: true, ocupadas: lista });
}

// ---------- Carta (personal, con CLAVE_BARRA) ----------
// Lee y cambia la pestaña «carta» por el nombre de la cerveza. Las columnas
// se buscan por su encabezado, así que el orden de la hoja puede cambiar.

var HOJA_CARTA = 'carta';
var DISPONIBLE_VALORES = ['si', 'no']; // los mismos que acepta la página y la lista desplegable

function hojaCarta_() {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(HOJA_CARTA);
  if (!hoja) throw new Error('sin_carta');
  var ancho = hoja.getLastColumn();
  var alto = hoja.getLastRow();
  var datos = hoja.getRange(1, 1, Math.max(alto, 1), ancho).getValues();
  var col = {};
  for (var j = 0; j < datos[0].length; j++) col[texto_(datos[0][j]).toLowerCase()] = j;
  return { hoja: hoja, col: col, filas: datos.slice(1) };
}

function celdaCarta_(c, f, nombre) {
  return c.col[nombre] === undefined ? '' : f[c.col[nombre]];
}

function listarCarta_() {
  var c = hojaCarta_();
  var lista = [];
  for (var i = 0; i < c.filas.length; i++) {
    var f = c.filas[i];
    var nombre = texto_(celdaCarta_(c, f, 'nombre'));
    if (!nombre) continue;
    lista.push({
      fila: i + 2, nombre: nombre,
      precio: celdaCarta_(c, f, 'precio'),
      precio_oferta: celdaCarta_(c, f, 'precio_oferta'),
      disponible: texto_(celdaCarta_(c, f, 'disponible')).toLowerCase()
    });
  }
  return responder_({ ok: true, carta: lista });
}

function enteroPesos_(v) {
  var t = texto_(v);
  if (!/^\d{1,7}$/.test(t)) return null;
  return Number(t);
}

function cambiarCarta_(datos) {
  if (!claveValida_(datos.clave)) return responder_({ ok: false, error: 'clave_invalida' });
  var nombre = texto_(datos.nombre);
  if (!nombre) return responder_({ ok: false, error: 'faltan_datos' });

  var cambios = {};
  if (datos.disponible !== undefined) {
    var d = texto_(datos.disponible).toLowerCase();
    if (DISPONIBLE_VALORES.indexOf(d) === -1) return responder_({ ok: false, error: 'disponible_invalido' });
    cambios.disponible = d;
  }
  if (datos.precio !== undefined) {
    var p = enteroPesos_(datos.precio);
    if (p === null || p < 1) return responder_({ ok: false, error: 'precio_invalido' });
    cambios.precio = p;
  }
  if (datos.precio_oferta !== undefined) {
    if (texto_(datos.precio_oferta) === '') {
      cambios.precio_oferta = '';
    } else {
      var po = enteroPesos_(datos.precio_oferta);
      if (po === null || po < 1) return responder_({ ok: false, error: 'precio_oferta_invalido' });
      cambios.precio_oferta = po;
    }
  }
  if (Object.keys(cambios).length === 0) return responder_({ ok: false, error: 'sin_cambios' });

  return conLock_(function () {
    var c = hojaCarta_();
    var buscado = nombre.toLowerCase();
    var encontradas = [];
    for (var i = 0; i < c.filas.length; i++) {
      if (texto_(celdaCarta_(c, c.filas[i], 'nombre')).toLowerCase() === buscado) encontradas.push(i);
    }
    if (encontradas.length === 0) return responder_({ ok: false, error: 'no_existe' });
    if (encontradas.length > 1) return responder_({ ok: false, error: 'nombre_repetido' });
    var fila = encontradas[0] + 2;
    for (var k in cambios) {
      if (c.col[k] === undefined) return responder_({ ok: false, error: 'sin_columna_' + k });
    }
    for (var campo in cambios) {
      c.hoja.getRange(fila, c.col[campo] + 1, 1, 1).setValues([[cambios[campo]]]);
    }
    SpreadsheetApp.flush();
    return responder_({ ok: true, fila: fila });
  });
}

// ---------- Happy hour (personal, con CLAVE_BARRA) ----------
// Pestaña «happy-hour»: dias, inicio, fin, zona, activo. Se usa la primera
// fila con datos. Si falta la columna «activo», el script la crea con «si».
// La página del cliente oculta el happy hour cuando activo es «no».

var HOJA_HAPPY = 'happy-hour';
var COLUMNAS_HAPPY = ['dias', 'inicio', 'fin', 'zona', 'activo'];
var DIAS_HAPPY = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
var DIAS_PATRON = /^(lun|mar|mie|jue|vie|sab|dom)(-(lun|mar|mie|jue|vie|sab|dom))?(,(lun|mar|mie|jue|vie|sab|dom)(-(lun|mar|mie|jue|vie|sab|dom))?)*$/;
var HORA_PATRON = /^([01]\d|2[0-3]):[0-5]\d$/;

function hojaHappy_() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(HOJA_HAPPY);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA_HAPPY);
    hoja.getRange(1, 1, 2, COLUMNAS_HAPPY.length).setNumberFormat('@');
    hoja.getRange(1, 1, 2, COLUMNAS_HAPPY.length).setValues([COLUMNAS_HAPPY, ['lun-jue', '18:00', '20:00', ZONA, 'si']]);
    hoja.getRange(1, 1, 1, COLUMNAS_HAPPY.length).setFontWeight('bold');
  }
  var ancho = Math.max(hoja.getLastColumn(), 1);
  var encabezado = hoja.getRange(1, 1, 1, ancho).getValues()[0];
  var col = {};
  for (var j = 0; j < encabezado.length; j++) {
    var n = texto_(encabezado[j]).toLowerCase();
    if (n && col[n] === undefined) col[n] = j;
  }
  for (var k = 0; k < COLUMNAS_HAPPY.length; k++) {
    var nombre = COLUMNAS_HAPPY[k];
    if (col[nombre] !== undefined) continue;
    ancho += 1;
    hoja.getRange(1, ancho, 1, 1).setValue(nombre).setFontWeight('bold');
    col[nombre] = ancho - 1;
    if (nombre === 'activo' && hoja.getLastRow() >= 2) {
      var vacias = [];
      for (var r = 2; r <= hoja.getLastRow(); r++) vacias.push(['si']);
      hoja.getRange(2, ancho, vacias.length, 1).setValues(vacias);
    }
  }
  var alto = hoja.getLastRow();
  var fila = 2;
  if (alto >= 2) {
    var filas = hoja.getRange(2, 1, alto - 1, ancho).getValues();
    for (var i = 0; i < filas.length; i++) {
      if (texto_(filas[i][col.dias]) || texto_(filas[i][col.inicio])) { fila = i + 2; break; }
    }
  }
  var valores = hoja.getRange(fila, 1, 1, ancho).getValues()[0];
  return { hoja: hoja, col: col, fila: fila, valores: valores };
}

function datosHappy_(h) {
  var activo = texto_(h.valores[h.col.activo]).toLowerCase();
  return {
    dias: texto_(h.valores[h.col.dias]).toLowerCase(),
    inicio: horaTexto_(h.valores[h.col.inicio]),
    fin: horaTexto_(h.valores[h.col.fin]),
    activo: activo === 'no' ? 'no' : 'si'
  };
}

function listarHappy_() {
  return conLock_(function () {
    var h = hojaHappy_();
    SpreadsheetApp.flush();
    return responder_({ ok: true, happy: datosHappy_(h) });
  });
}

function cambiarHappy_(datos) {
  if (!claveValida_(datos.clave)) return responder_({ ok: false, error: 'clave_invalida' });
  var cambios = {};
  if (datos.activo !== undefined) {
    var a = texto_(datos.activo).toLowerCase();
    if (DISPONIBLE_VALORES.indexOf(a) === -1) return responder_({ ok: false, error: 'activo_invalido' });
    cambios.activo = a;
  }
  if (datos.dias !== undefined) {
    var d = texto_(datos.dias).toLowerCase().replace(/\s+/g, '');
    if (!DIAS_PATRON.test(d)) return responder_({ ok: false, error: 'dias_invalidos' });
    cambios.dias = d;
  }
  if (datos.inicio !== undefined) {
    var ini = texto_(datos.inicio);
    if (!HORA_PATRON.test(ini)) return responder_({ ok: false, error: 'hora_invalida' });
    cambios.inicio = ini;
  }
  if (datos.fin !== undefined) {
    var fin = texto_(datos.fin);
    if (!HORA_PATRON.test(fin)) return responder_({ ok: false, error: 'hora_invalida' });
    cambios.fin = fin;
  }
  if (Object.keys(cambios).length === 0) return responder_({ ok: false, error: 'sin_cambios' });

  return conLock_(function () {
    var h = hojaHappy_();
    var actual = datosHappy_(h);
    var inicio = cambios.inicio || actual.inicio;
    var termino = cambios.fin || actual.fin;
    if (inicio && inicio === termino) return responder_({ ok: false, error: 'horas_iguales' });
    for (var campo in cambios) {
      // Formato texto: así Sheets no convierte «18:00» en una fecha.
      var celda = h.hoja.getRange(h.fila, h.col[campo] + 1, 1, 1);
      celda.setNumberFormat('@');
      celda.setValues([[cambios[campo]]]);
      h.valores[h.col[campo]] = cambios[campo];
    }
    if (!texto_(h.valores[h.col.zona])) {
      h.hoja.getRange(h.fila, h.col.zona + 1, 1, 1).setValue(ZONA);
    }
    SpreadsheetApp.flush();
    return responder_({ ok: true, happy: datosHappy_(h) });
  });
}

function responder_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
