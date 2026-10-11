/* Dirección /exec del Google Apps Script.
   La usan el cuadrito de reserva, la franja del mesero y barra.html.
   Para cambiarla, edita solo esta línea.
   Vacía: la reserva solo abre WhatsApp y los llamados quedan en demo. */
var RESERVAS_URL = 'https://script.google.com/macros/s/AKfycbzbHLeRKXEEPZznsRXroGQXJtL2tTRFsz7MyqNL4Nb7g4I60RZKXpME4sac2dbtAKM/exec';

/* Si Google responde una página HTML al cambiar de versión, se reintenta
   cerca de un minuto. Una respuesta JSON, aunque sea un error, no se repite. */
function brumaEsperar(ms) {
    return new Promise(function (resolver) { setTimeout(resolver, ms); });
}

function brumaLeerScript(url, opciones, alReintentar) {
    var intentos = 4;
    var pausa = 20000;

    function una(n) {
        return fetch(url, opciones).then(function (res) {
            return res.text();
        }).then(function (texto) {
            try {
                return JSON.parse(texto);
            } catch (error) {
                var esHtml = /<!doctype html|<html[\s>]/i.test(String(texto || '').slice(0, 500));
                if (esHtml && n + 1 < intentos) {
                    if (typeof alReintentar === 'function') alReintentar();
                    return brumaEsperar(pausa).then(function () { return una(n + 1); });
                }
                return null;
            }
        }).catch(function () {
            return null;
        });
    }

    return una(0);
}
