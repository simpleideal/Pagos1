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
var COLUMNAS = ['creada', 'mesa', 'fecha', 'hora', 'personas', 'nombre', 'telefono', 'estado', 'nota'];
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
 */
function doGet(e) {
  var p = (e && e.parameter) || {};
  var accion = texto_(p.accion);
  try {
    if (accion === '') return responder_({ ok: true });
    if (accion === 'llamado') return estadoLlamado_(texto_(p.id));
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
 * POST sin accion o accion=reservar  -> reserva {ok} (como antes)
 * POST accion=llamar {mesa, website} -> {ok, id}
 * POST accion=listo {id, clave}      -> {ok}
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
    var valores = [[creada, r.mesa, r.fecha, r.hora, r.personas, r.nombre, r.telefono, 'pendiente', '']];
    // Formato texto para que Sheets no convierta fecha, hora ni teléfono.
    hoja.getRange(fila, 1, 1, 7).setNumberFormat('@');
    hoja.getRange(fila, 1, 1, COLUMNAS.length).setValues(valores);
    SpreadsheetApp.flush();
    return responder_({ ok: true });
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

function responder_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
