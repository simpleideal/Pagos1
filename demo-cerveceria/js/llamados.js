/* Llamados al mesero. Con RESERVAS_URL habla con el script.
   Sin ella, guarda la lista en este navegador (bruma-llamados). */
(function () {
    var CLAVE_LISTA = 'bruma-llamados';

    function urlScript() {
        return String(typeof RESERVAS_URL === 'string' ? RESERVAS_URL : '').trim();
    }

    function esDemo() {
        return !urlScript();
    }

    function leer() {
        try {
            var data = JSON.parse(localStorage.getItem(CLAVE_LISTA) || '[]');
            if (!Array.isArray(data)) return [];
            return data.filter(function (item) {
                return item && item.id;
            }).map(function (item) {
                return {
                    id: String(item.id),
                    mesa: String(item.mesa),
                    hora: String(item.hora || ''),
                    estado: item.estado === 'listo' ? 'listo' : 'pendiente'
                };
            });
        } catch (error) {
            return [];
        }
    }

    function guardar(lista) {
        localStorage.setItem(CLAVE_LISTA, JSON.stringify(lista));
    }

    function post(cuerpo) {
        return fetch(urlScript(), {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(cuerpo)
        }).then(function (res) {
            return res.json().catch(function () { return null; });
        });
    }

    function get(params) {
        var destino = new URL(urlScript(), location.href);
        Object.keys(params).forEach(function (clave) {
            destino.searchParams.set(clave, params[clave]);
        });
        return fetch(destino.toString()).then(function (res) {
            return res.json().catch(function () { return null; });
        });
    }

    window.BRUMA_LLAMADOS = {
        esDemo: esDemo,
        llamar: function (mesa, website) {
            if (esDemo()) {
                var lista = leer();
                var id = 'd' + Date.now().toString(36);
                lista.push({
                    id: id,
                    mesa: String(mesa),
                    hora: new Date().toISOString(),
                    estado: 'pendiente'
                });
                guardar(lista);
                return Promise.resolve({ ok: true, id: id });
            }
            return post({
                accion: 'llamar',
                mesa: String(mesa),
                website: website || ''
            });
        },
        llamado: function (id) {
            if (esDemo()) {
                var hallado = null;
                leer().forEach(function (item) {
                    if (item.id === String(id)) hallado = item;
                });
                return Promise.resolve({ estado: hallado ? hallado.estado : 'pendiente' });
            }
            return get({ accion: 'llamado', id: String(id) });
        },
        llamados: function () {
            if (esDemo()) return Promise.resolve({ ok: true, llamados: leer() });
            return get({ accion: 'llamados', clave: arguments[0] || '' });
        },
        listo: function (id, clave) {
            if (esDemo()) {
                var lista = leer().map(function (item) {
                    if (item.id === String(id)) item.estado = 'listo';
                    return item;
                });
                guardar(lista);
                return Promise.resolve({ ok: true });
            }
            return post({ accion: 'listo', id: String(id), clave: clave || '' });
        }
    };
})();
