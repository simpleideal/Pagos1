/**
 * Cervecería Bruma: recibe pedidos de reserva y los anota en la pestaña «reservas».
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

function doGet() {
  return responder_({ ok: true });
}

function doPost(e) {
  var datos;
  try {
    datos = leerDatos_(e);
  } catch (err) {
    return responder_({ ok: false, error: 'datos_ilegibles' });
  }

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

function responder_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
