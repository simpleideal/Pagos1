/* Mesas para la reserva. No dibuja el visor.
   Lee FUENTE.mesas (CSV publicado). Si está vacío o falla, usa datos/mesas.csv.
   Deja el arreglo en window.BRUMA_MESAS y avisa con el evento bruma:mesas. */
(function () {
    var LOCAL = 'datos/mesas.csv';
    var ZONAS = { barra: true, mesas: true, terraza: true };

    function clave(texto) {
        var limpio = String(texto || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_|_$/g, '');
        var alias = {
            mesa: 'mesa',
            numero: 'mesa',
            nombre: 'mesa',
            zona: 'zona',
            escena: 'zona',
            scene: 'zona',
            capacidad: 'capacidad',
            personas: 'capacidad',
            cupos: 'capacidad',
            estado: 'estado',
            yaw: 'yaw',
            horizontal: 'yaw',
            pitch: 'pitch',
            vertical: 'pitch',
            nota: 'nota',
            comentario: 'nota',
            plano_x: 'plano_x',
            x: 'plano_x',
            plano_y: 'plano_y',
            y: 'plano_y',
            forma: 'forma',
            reservada_desde: 'reservada_desde',
            desde: 'reservada_desde',
            reservada_hasta: 'reservada_hasta',
            hasta: 'reservada_hasta',
            fecha: 'fecha'
        };
        return alias[limpio] || limpio;
    }

    function sinTilde(texto) {
        return String(texto || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .trim();
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
        var keys = filas[0].map(clave);
        return filas.slice(1).map(function (cols) {
            var o = {};
            keys.forEach(function (k, idx) {
                if (k) o[k] = String(cols[idx] == null ? '' : cols[idx]).trim();
            });
            return o;
        });
    }

    function grados(valor) {
        var s = String(valor == null ? '' : valor).trim().replace(',', '.');
        if (!s) return null;
        var x = Number(s);
        return isFinite(x) ? x : null;
    }

    function capacidadDe(valor) {
        var x = parseInt(String(valor == null ? '' : valor).replace(/[^\d]/g, ''), 10);
        return isFinite(x) ? x : 0;
    }

    function estadoDe(valor) {
        var s = sinTilde(valor);
        if (s === 'reservada' || s === 'reservado' || s === 'ocupada' || s === 'ocupado') return 'reservada';
        return 'libre';
    }

    function porcentaje(valor) {
        var n = grados(valor);
        if (n == null) return null;
        if (n < 0) return 0;
        if (n > 100) return 100;
        return n;
    }

    function minutosDe(valor) {
        var s = String(valor == null ? '' : valor).trim();
        var m = s.match(/^(\d{1,2}):(\d{2})$/);
        if (!m) return null;
        var h = Number(m[1]);
        var min = Number(m[2]);
        if (h === 24 && min === 0) return 0;
        if (h < 0 || h > 23 || min < 0 || min > 59) return null;
        return h * 60 + min;
    }

    function fechaDe(valor) {
        var s = String(valor || '').trim();
        return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
    }

    function formaDe(valor) {
        var s = sinTilde(valor);
        if (s === 'redonda' || s === 'cuadrada' || s === 'barra') return s;
        return null;
    }

    function partesChile(date) {
        var fmt = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Santiago',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
        });
        var partes = {};
        fmt.formatToParts(date).forEach(function (p) {
            if (p.type !== 'literal') partes[p.type] = p.value;
        });
        var hora = Number(partes.hour);
        if (hora === 24) hora = 0;
        return {
            fecha: partes.year + '-' + partes.month + '-' + partes.day,
            minutos: hora * 60 + Number(partes.minute)
        };
    }

    function enRango(minutos, desde, hasta) {
        if (desde <= hasta) return minutos >= desde && minutos <= hasta;
        return minutos >= desde || minutos <= hasta;
    }

    function ocupadaEn(mesa, minutos, fecha) {
        var porEstado = mesa.estado === 'reservada';
        if (mesa.reservada_desde == null || mesa.reservada_hasta == null) return porEstado;
        if (mesa.fecha && mesa.fecha !== fecha) return porEstado;
        if (minutos == null) return porEstado;
        return enRango(minutos, mesa.reservada_desde, mesa.reservada_hasta);
    }

    function mesaDe(fila) {
        var mesa = String(fila.mesa || '').trim();
        var zona = sinTilde(fila.zona);
        if (!mesa || !ZONAS[zona]) return null;
        return {
            mesa: mesa,
            zona: zona,
            capacidad: capacidadDe(fila.capacidad),
            estado: estadoDe(fila.estado),
            yaw: grados(fila.yaw),
            pitch: grados(fila.pitch),
            nota: String(fila.nota || '').trim(),
            plano_x: porcentaje(fila.plano_x),
            plano_y: porcentaje(fila.plano_y),
            forma: formaDe(fila.forma),
            reservada_desde: minutosDe(fila.reservada_desde),
            reservada_hasta: minutosDe(fila.reservada_hasta),
            fecha: fechaDe(fila.fecha),
            ocupada_ahora: false
        };
    }

    function limpiar(filas) {
        return filas.map(mesaDe).filter(Boolean);
    }

    function resolver(entrada) {
        var t = String(entrada || '').trim();
        if (!t) return { tipo: 'csv', url: LOCAL };
        if (/opensheet\.(elk\.sh|vercel\.app)/i.test(t)) return { tipo: 'json', url: t };
        if (/\.csv(\?|$)/i.test(t) || /output=csv/i.test(t) || /tqx=out:csv/i.test(t)) {
            return { tipo: 'csv', url: t };
        }
        var pub = t.match(/\/spreadsheets\/d\/e\/([^/]+)/);
        if (pub) {
            return { tipo: 'csv', url: 'https://docs.google.com/spreadsheets/d/e/' + pub[1] + '/pub?output=csv' };
        }
        var id = t.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        if (id) {
            var gid = (t.match(/[?&#]gid=([0-9]+)/) || [])[1];
            var url = 'https://docs.google.com/spreadsheets/d/' + id[1] + '/gviz/tq?tqx=out:csv';
            if (gid) url += '&gid=' + gid;
            return { tipo: 'csv', url: url };
        }
        return { tipo: 'csv', url: t };
    }

    function leer(fuente) {
        return fetch(fuente.url, { cache: 'no-store' }).then(function (res) {
            if (!res.ok) throw new Error('http ' + res.status);
            if (fuente.tipo === 'json') return res.json().then(function (data) {
                var lista = Array.isArray(data) ? data : [];
                return lista.map(function (row) {
                    var o = {};
                    Object.keys(row || {}).forEach(function (k) {
                        o[clave(k)] = String(row[k] == null ? '' : row[k]).trim();
                    });
                    return o;
                });
            });
            return res.text().then(parsearCsv);
        });
    }

    function firma(lista) {
        return lista.map(function (mesa) {
            return mesa.mesa + (mesa.ocupada_ahora ? '1' : '0');
        }).join(',');
    }

    function aplicarAhora(lista, date) {
        var chile = partesChile(date || new Date());
        lista.forEach(function (mesa) {
            mesa.ocupada_ahora = ocupadaEn(mesa, chile.minutos, chile.fecha);
        });
    }

    function publicar(lista, forzar) {
        var antes = firma(lista);
        aplicarAhora(lista);
        window.BRUMA_MESAS = lista;
        if (forzar || firma(lista) !== antes) {
            window.dispatchEvent(new CustomEvent('bruma:mesas', { detail: lista }));
        }
    }

    window.BRUMA_MESAS_LIBRE_A = function (hora, fecha) {
        var minutos = minutosDe(hora);
        var dia = fecha ? fechaDe(fecha) : null;
        if (!dia) dia = partesChile(new Date()).fecha;
        return (window.BRUMA_MESAS || []).map(function (mesa) {
            var cuando = minutos == null ? partesChile(new Date()).minutos : minutos;
            var ocupada = ocupadaEn(mesa, cuando, dia);
            return { mesa: mesa.mesa, libre: !ocupada, ocupada: ocupada };
        });
    };

    function cargar() {
        var pedido = resolver(window.FUENTE && window.FUENTE.mesas);
        function usarLocal() {
            if (pedido.url === LOCAL) return Promise.reject(new Error('sin mesas'));
            return leer({ tipo: 'csv', url: LOCAL });
        }
        return leer(pedido).then(function (filas) {
            var lista = limpiar(filas);
            if (lista.length || pedido.url === LOCAL) return lista;
            return usarLocal().then(limpiar);
        }).catch(function () {
            return usarLocal().then(limpiar).catch(function () { return []; });
        }).then(function (lista) {
            publicar(lista, true);
        });
    }

    setInterval(function () {
        if (window.BRUMA_MESAS && window.BRUMA_MESAS.length) publicar(window.BRUMA_MESAS, false);
    }, 60000);

    cargar();
})();
