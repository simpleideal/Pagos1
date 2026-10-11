/* Contrato del personal. Para ajustar la vitrina, cambia este archivo.
   disponible en la hoja es si o no (los mismos que ya lee la carta pública).

   GET  ?accion=reservas&clave=K
        {ok, reservas:[{id, mesa, fecha, hora, personas, nombre, telefono, estado}]}
   POST {accion:'confirmar'|'rechazar', id, clave} -> {ok}
   POST {accion:'sin_reserva', mesa, personas?, minutos?, clave} -> {ok, id}
        minutos, si no viene, 120.
   GET  ?accion=ocupadas
        {ok, ocupadas:[{mesa, fecha, desde, hasta}]}
   GET  ?accion=carta&clave=K
        {ok, carta:[{fila, nombre, precio, precio_oferta, disponible}]}
   POST {accion:'carta', clave, nombre, disponible?, precio?, precio_oferta?}
        -> {ok, fila}
        Busca por nombre. precio_oferta:'' quita la oferta.
        Errores: disponible_invalido, precio_invalido, precio_oferta_invalido,
        no_existe, nombre_repetido, sin_cambios.

   Si la acción no está publicada, el script responde accion_invalida
   y aquí se usan datos de ejemplo. */
(function () {
    var CARTA_CSV = 'datos/carta.csv';
    var MINUTOS_VISITA = 120;
    var FRASES = {
        disponible_invalido: 'Elige Hay o Agotado',
        precio_invalido: 'Ese precio no sirve, escribe solo números',
        precio_oferta_invalido: 'Esa oferta no sirve, escribe solo números',
        no_existe: 'No está en la carta',
        nombre_repetido: 'Hay dos con el mismo nombre',
        sin_cambios: 'No había cambios',
        clave_invalida: 'Clave incorrecta'
    };

    var reservasDemo = null;
    var cartaDemo = null;
    var visitasDemo = [];
    var cartaCargando = null;

    function urlScript() {
        return String(typeof RESERVAS_URL === 'string' ? RESERVAS_URL : '').trim();
    }

    function frase(codigo) {
        var clave = String(codigo || '');
        return FRASES[clave] || 'No se pudo guardar';
    }

    function get(params, alReintentar) {
        if (!urlScript() || typeof window.brumaLeerScript !== 'function') {
            return Promise.resolve(null);
        }
        var destino;
        try {
            destino = new URL(urlScript(), location.href);
        } catch (error) {
            return Promise.resolve(null);
        }
        Object.keys(params).forEach(function (clave) {
            destino.searchParams.set(clave, params[clave]);
        });
        return window.brumaLeerScript(destino.toString(), { method: 'GET' }, alReintentar);
    }

    function post(cuerpo, alReintentar) {
        if (!urlScript() || typeof window.brumaLeerScript !== 'function') {
            return Promise.resolve(null);
        }
        return window.brumaLeerScript(urlScript(), {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(cuerpo)
        }, alReintentar);
    }

    function esAccionInvalida(data) {
        return !!(data && data.ok === false && String(data.error) === 'accion_invalida');
    }

    function esClaveInvalida(data) {
        return !!(data && data.ok === false && (!data.error || String(data.error) === 'clave_invalida'));
    }

    function fechaChile(date) {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Santiago',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    }

    function horaChile(date) {
        var s = new Intl.DateTimeFormat('en-GB', {
            timeZone: 'America/Santiago',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
        }).format(date);
        if (s.slice(0, 2) === '24') s = '00' + s.slice(2);
        return s;
    }

    function minutosDe(valor) {
        var m = String(valor == null ? '' : valor).trim().match(/^(\d{1,2}):(\d{2})/);
        if (!m) return null;
        var h = Number(m[1]);
        var min = Number(m[2]);
        if (h === 24 && min === 0) return 0;
        if (h < 0 || h > 23 || min < 0 || min > 59) return null;
        return h * 60 + min;
    }

    function hhmm(minutos) {
        var m = ((minutos % 1440) + 1440) % 1440;
        var h = Math.floor(m / 60);
        var min = m % 60;
        return (h < 10 ? '0' : '') + h + ':' + (min < 10 ? '0' : '') + min;
    }

    function enRango(minutos, desde, hasta) {
        if (desde <= hasta) return minutos >= desde && minutos <= hasta;
        return minutos >= desde || minutos <= hasta;
    }

    function proximoSabado(iso) {
        var p = iso.split('-');
        var t = Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
        var dia = new Date(t).getUTCDay();
        var suma = (6 - dia + 7) % 7;
        var siguiente = new Date(t + suma * 86400000);
        var y = siguiente.getUTCFullYear();
        var mo = siguiente.getUTCMonth() + 1;
        var d = siguiente.getUTCDate();
        return y + '-' + (mo < 10 ? '0' : '') + mo + '-' + (d < 10 ? '0' : '') + d;
    }

    function semillaReservas() {
        var hoy = fechaChile(new Date());
        return [
            {
                id: 'ej-juan',
                mesa: '5',
                fecha: proximoSabado(hoy),
                hora: '21:00',
                personas: 4,
                nombre: 'Juan',
                telefono: '+56911112222',
                estado: 'pendiente'
            },
            {
                id: 'ej-ana',
                mesa: '2',
                fecha: hoy,
                hora: '19:00',
                personas: 2,
                nombre: 'Ana',
                telefono: '+56933334444',
                estado: 'confirmada'
            }
        ];
    }

    function asegurarReservas() {
        if (!reservasDemo) reservasDemo = semillaReservas();
        return reservasDemo;
    }

    function parsearCsv(texto) {
        var filas = [];
        var fila = [];
        var celda = '';
        var enComillas = false;
        var s = String(texto || '').replace(/^\uFEFF/, '');
        var i, c, n;
        for (i = 0; i < s.length; i += 1) {
            c = s[i];
            n = s[i + 1];
            if (enComillas) {
                if (c === '"' && n === '"') { celda += '"'; i += 1; }
                else if (c === '"') enComillas = false;
                else celda += c;
            } else if (c === '"') {
                enComillas = true;
            } else if (c === ',') {
                fila.push(celda);
                celda = '';
            } else if (c === '\n' || (c === '\r' && n === '\n')) {
                if (c === '\r') i += 1;
                fila.push(celda);
                celda = '';
                if (fila.some(function (x) { return String(x).trim() !== ''; })) filas.push(fila);
                fila = [];
            } else if (c !== '\r') {
                celda += c;
            }
        }
        fila.push(celda);
        if (fila.some(function (x) { return String(x).trim() !== ''; })) filas.push(fila);
        if (!filas.length) return [];
        var keys = filas[0].map(function (k) { return String(k || '').trim(); });
        return filas.slice(1).map(function (cols) {
            var o = {};
            keys.forEach(function (k, idx) {
                if (k) o[k] = String(cols[idx] == null ? '' : cols[idx]).trim();
            });
            return o;
        });
    }

    function cargarCartaCsv() {
        if (cartaDemo) return Promise.resolve(cartaDemo);
        if (cartaCargando) return cartaCargando;
        cartaCargando = fetch(CARTA_CSV, { cache: 'no-store' }).then(function (res) {
            if (!res.ok) throw new Error('csv');
            return res.text();
        }).then(function (texto) {
            cartaDemo = parsearCsv(texto).filter(function (fila) {
                return fila.nombre;
            }).map(function (fila, indice) {
                return {
                    fila: indice + 2,
                    nombre: fila.nombre,
                    precio: fila.precio || '',
                    precio_oferta: fila.precio_oferta || '',
                    disponible: fila.disponible || ''
                };
            });
            cartaCargando = null;
            return cartaDemo;
        }).catch(function () {
            cartaCargando = null;
            cartaDemo = [];
            return cartaDemo;
        });
        return cartaCargando;
    }

    function agotado(valor) {
        var s = String(valor || '').trim().toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        return s === 'no' || s === 'false' || s === '0' || s === 'agotada' || s === 'agotado';
    }

    function esPrecio(valor) {
        if (typeof valor === 'number') {
            return isFinite(valor) && valor > 0 && Math.round(valor) === valor;
        }
        return /^[1-9]\d*$/.test(String(valor == null ? '' : valor).trim());
    }

    function numeroPrecio(valor) {
        if (!esPrecio(valor)) return null;
        return Number(String(valor).trim());
    }

    function mismoPrecio(actual, nuevo) {
        var a = numeroPrecio(actual);
        var b = numeroPrecio(nuevo);
        if (a == null && b == null) return String(actual || '') === String(nuevo || '');
        return a === b;
    }

    function guardarCartaDemo(cambios) {
        var nombre = String(cambios.nombre || '').trim();
        var lista = cartaDemo || [];
        var coinciden = lista.filter(function (item) { return item.nombre === nombre; });
        if (!coinciden.length) return { ok: false, error: 'no_existe' };
        if (coinciden.length > 1) return { ok: false, error: 'nombre_repetido' };
        var item = coinciden[0];
        var hayCambio = false;
        if (cambios.disponible != null && cambios.disponible !== '') {
            var marca = String(cambios.disponible).trim().toLowerCase();
            if (marca !== 'si' && marca !== 'no') return { ok: false, error: 'disponible_invalido' };
            if (String(item.disponible).trim().toLowerCase() !== marca) {
                item.disponible = marca;
                hayCambio = true;
            }
        }
        if (cambios.precio != null && cambios.precio !== '') {
            if (!esPrecio(cambios.precio)) return { ok: false, error: 'precio_invalido' };
            var precio = numeroPrecio(cambios.precio);
            if (!mismoPrecio(item.precio, precio)) {
                item.precio = precio;
                hayCambio = true;
            }
        }
        if (cambios.precio_oferta != null) {
            if (cambios.precio_oferta === '') {
                if (String(item.precio_oferta || '') !== '') {
                    item.precio_oferta = '';
                    hayCambio = true;
                }
            } else if (!esPrecio(cambios.precio_oferta)) {
                return { ok: false, error: 'precio_oferta_invalido' };
            } else {
                var oferta = numeroPrecio(cambios.precio_oferta);
                if (!mismoPrecio(item.precio_oferta, oferta)) {
                    item.precio_oferta = oferta;
                    hayCambio = true;
                }
            }
        }
        if (!hayCambio) return { ok: false, error: 'sin_cambios' };
        return { ok: true, fila: item.fila };
    }

    function visitaCubre(item, mesa, cuando) {
        if (!item || String(item.mesa) !== String(mesa)) return false;
        var fecha = cuando.fecha;
        if (item.fecha && String(item.fecha) !== fecha) return false;
        var desde = minutosDe(item.desde);
        var hasta = minutosDe(item.hasta);
        var minutos = cuando.minutos;
        if (desde == null || hasta == null || minutos == null) return false;
        return enRango(minutos, desde, hasta);
    }

    function anotarVisita(mesa, minutos) {
        var ahora = new Date();
        var desdeMin = minutosDe(horaChile(ahora));
        var largo = minutos == null ? MINUTOS_VISITA : Number(minutos);
        if (!isFinite(largo) || largo <= 0) largo = MINUTOS_VISITA;
        visitasDemo.push({
            mesa: String(mesa),
            fecha: fechaChile(ahora),
            desde: hhmm(desdeMin),
            hasta: hhmm(desdeMin + largo)
        });
    }

    function ocupar(mesa, hora) {
        var ahora = new Date();
        var cuando = {
            fecha: fechaChile(ahora),
            minutos: hora ? minutosDe(hora) : minutosDe(horaChile(ahora))
        };
        var i;
        for (i = 0; i < visitasDemo.length; i += 1) {
            if (visitaCubre(visitasDemo[i], mesa, cuando)) return true;
        }
        return false;
    }

    function entrar(clave, alReintentar) {
        if (!urlScript()) {
            return Promise.resolve({
                ok: true,
                demoReservas: true,
                demoLlamados: true,
                guardarClave: true
            });
        }
        return get({ accion: 'reservas', clave: clave || '' }, alReintentar).then(function (data) {
            if (esClaveInvalida(data)) return { ok: false, error: 'clave_invalida' };
            if (data && data.ok === true && Array.isArray(data.reservas)) {
                return {
                    ok: true,
                    demoReservas: false,
                    demoLlamados: false,
                    guardarClave: true,
                    reservas: data.reservas
                };
            }
            if (!esAccionInvalida(data)) return { ok: false, error: 'no_se_pudo' };
            if (!window.BRUMA_LLAMADOS) {
                return {
                    ok: true,
                    demoReservas: true,
                    demoLlamados: true,
                    guardarClave: true
                };
            }
            return window.BRUMA_LLAMADOS.llamados(clave).then(function (ll) {
                var llamadosReales = !!(ll && ll.ok === true && Array.isArray(ll.llamados));
                var claveMala = esClaveInvalida(ll);
                return {
                    ok: true,
                    demoReservas: true,
                    demoLlamados: !llamadosReales,
                    guardarClave: llamadosReales || !claveMala
                };
            });
        });
    }

    function reservas(clave, demo, alReintentar) {
        if (demo || !urlScript()) {
            return Promise.resolve({ ok: true, reservas: asegurarReservas().slice(), demo: true });
        }
        return get({ accion: 'reservas', clave: clave || '' }, alReintentar).then(function (data) {
            if (esAccionInvalida(data) || !urlScript()) {
                return { ok: true, reservas: asegurarReservas().slice(), demo: true };
            }
            return data;
        });
    }

    function cambiarEstado(id, estado) {
        asegurarReservas().forEach(function (item) {
            if (String(item.id) === String(id)) item.estado = estado;
        });
        if (estado === 'rechazada') {
            reservasDemo = reservasDemo.filter(function (item) {
                return String(item.id) !== String(id);
            });
        }
    }

    function confirmar(id, clave, demo) {
        if (demo || !urlScript()) {
            cambiarEstado(id, 'confirmada');
            return Promise.resolve({ ok: true });
        }
        return post({ accion: 'confirmar', id: String(id), clave: clave || '' });
    }

    function rechazar(id, clave, demo) {
        if (demo || !urlScript()) {
            cambiarEstado(id, 'rechazada');
            return Promise.resolve({ ok: true });
        }
        return post({ accion: 'rechazar', id: String(id), clave: clave || '' });
    }

    function sinReserva(mesa, personas, clave, demo, minutos) {
        var largo = minutos == null ? MINUTOS_VISITA : minutos;
        if (demo || !urlScript()) {
            var id = 'ej-' + Date.now().toString(36);
            var ahora = new Date();
            asegurarReservas().push({
                id: id,
                mesa: String(mesa),
                fecha: fechaChile(ahora),
                hora: horaChile(ahora),
                personas: personas || 2,
                nombre: 'Sin reserva',
                telefono: '',
                estado: 'confirmada'
            });
            anotarVisita(mesa, largo);
            return Promise.resolve({ ok: true, id: id });
        }
        return post({
            accion: 'sin_reserva',
            mesa: String(mesa),
            personas: personas,
            minutos: largo,
            clave: clave || ''
        }).then(function (data) {
            if (data && data.ok === true) anotarVisita(mesa, largo);
            return data;
        });
    }

    function carta(clave, demo, alReintentar) {
        if (demo || !urlScript()) {
            return cargarCartaCsv().then(function (lista) {
                return { ok: true, carta: lista, demo: true };
            });
        }
        return get({ accion: 'carta', clave: clave || '' }, alReintentar).then(function (data) {
            if (esAccionInvalida(data)) {
                return cargarCartaCsv().then(function (lista) {
                    return { ok: true, carta: lista, demo: true };
                });
            }
            return data;
        });
    }

    function validarCambios(cambios) {
        if (cambios.disponible != null && cambios.disponible !== '') {
            var marca = String(cambios.disponible).trim().toLowerCase();
            if (marca !== 'si' && marca !== 'no') return 'disponible_invalido';
        }
        if (cambios.precio != null && cambios.precio !== '' && !esPrecio(cambios.precio)) return 'precio_invalido';
        if (cambios.precio_oferta != null && cambios.precio_oferta !== '' && !esPrecio(cambios.precio_oferta)) {
            return 'precio_oferta_invalido';
        }
        return '';
    }

    function guardarCarta(clave, cambios, demo) {
        var malo = validarCambios(cambios);
        if (malo) return Promise.resolve({ ok: false, error: malo });
        if (demo || !urlScript()) {
            return cargarCartaCsv().then(function () {
                return guardarCartaDemo(cambios);
            });
        }
        var cuerpo = {
            accion: 'carta',
            clave: clave || '',
            nombre: String(cambios.nombre || '')
        };
        if (cambios.disponible != null) cuerpo.disponible = cambios.disponible;
        if (cambios.precio != null) cuerpo.precio = numeroPrecio(cambios.precio);
        if (cambios.precio_oferta != null) {
            cuerpo.precio_oferta = cambios.precio_oferta === '' ? '' : numeroPrecio(cambios.precio_oferta);
        }
        return post(cuerpo).then(function (data) {
            if (esAccionInvalida(data)) {
                return cargarCartaCsv().then(function () { return guardarCartaDemo(cambios); });
            }
            return data;
        });
    }

    window.BRUMA_ADMIN = {
        disponibleHay: 'si',
        disponibleNo: 'no',
        frase: frase,
        agotado: agotado,
        esPrecio: esPrecio,
        fechaChile: fechaChile,
        ocupaMesa: ocupar,
        entrar: entrar,
        reservas: reservas,
        confirmar: confirmar,
        rechazar: rechazar,
        sinReserva: sinReserva,
        carta: carta,
        guardarCarta: guardarCarta
    };
})();
