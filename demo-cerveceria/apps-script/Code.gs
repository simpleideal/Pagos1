/**
 * Anota una reserva de Cervecería Bruma en la pestaña Reservas.
 *
 * Se pega en Extensiones → Apps Script, en la hoja del local.
 * La página no cambia: cuando el cuadrito hace un POST a la
 * dirección /exec, este script guarda la fila.
 *
 * El navegador manda Content-Type text/plain para no pedir
 * permiso previo. El cuerpo igual es JSON:
 * mesa, fecha (AAAA-MM-DD), hora (HH:MM), personas, nombre,
 * telefono, website.
 *
 * website es una trampa para robots. Si trae texto, se contesta
 * {ok:true} y no se escribe nada.
 */

var HOJA_RESERVAS = 'Reservas';
var COLUMNAS = ['recibido', 'mesa', 'fecha', 'hora', 'personas', 'nombre', 'telefono'];
var ZONA = 'America/Santiago';

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return responder_({ ok: false, error: 'La hoja está ocupada. Prueba otra vez en un momento.' });
  }
  try {
    var leido = leerCuerpo_(e);
    if (leido.error) return responder_({ ok: false, error: leido.error });
    var datos = leido.datos;
    if (String(datos.website == null ? '' : datos.website).trim()) {
      return responder_({ ok: true });
    }
    var error = validar_(datos);
    if (error) return responder_({ ok: false, error: error });
    guardar_(datos);
    return responder_({ ok: true });
  } catch (err) {
    return responder_({ ok: false, error: 'No se pudo guardar la reserva.' });
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  return responder_({ ok: false, error: 'Esta dirección solo recibe reservas.' });
}

function leerCuerpo_(e) {
  var texto = e && e.postData && e.postData.contents ? String(e.postData.contents) : '';
  if (!texto.trim()) return { error: 'No se pudo leer la reserva.' };
  try {
    var datos = JSON.parse(texto);
    if (!datos || typeof datos !== 'object' || Object.prototype.toString.call(datos) === '[object Array]') {
      return { error: 'No se pudo leer la reserva.' };
    }
    return { datos: datos };
  } catch (err) {
    return { error: 'No se pudo leer la reserva.' };
  }
}

function validar_(datos) {
  if (!String(datos.mesa == null ? '' : datos.mesa).trim()) return 'Falta la mesa.';
  if (!fechaValida_(datos.fecha)) return 'La fecha tiene que ser AAAA-MM-DD.';
  if (!horaValida_(datos.hora)) return 'La hora tiene que ser HH:MM.';
  var personas = Number(datos.personas);
  if (!isFinite(personas) || personas < 1) return 'Faltan las personas.';
  if (!String(datos.nombre || '').trim()) return 'Falta el nombre.';
  if (!String(datos.telefono || '').trim()) return 'Falta el teléfono.';
  return '';
}

function fechaValida_(valor) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(valor || '').trim());
  if (!m) return false;
  var anio = Number(m[1]);
  var mes = Number(m[2]);
  var dia = Number(m[3]);
  var fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

function horaValida_(valor) {
  var m = /^(\d{2}):(\d{2})$/.exec(String(valor || '').trim());
  if (!m) return false;
  var hora = Number(m[1]);
  var minuto = Number(m[2]);
  return hora >= 0 && hora <= 23 && minuto >= 0 && minuto <= 59;
}

function guardar_(datos) {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(HOJA_RESERVAS);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA_RESERVAS);
  }
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
    hoja.getRange(1, 1, 1, COLUMNAS.length).setFontWeight('bold');
  }
  var zona = Session.getScriptTimeZone() || ZONA;
  var recibido = Utilities.formatDate(new Date(), zona, 'yyyy-MM-dd HH:mm');
  hoja.appendRow([
    recibido,
    String(datos.mesa).trim(),
    String(datos.fecha).trim(),
    String(datos.hora).trim(),
    Number(datos.personas),
    String(datos.nombre).trim(),
    String(datos.telefono).trim()
  ]);
}

function responder_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
