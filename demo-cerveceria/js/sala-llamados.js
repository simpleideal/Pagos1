/* Lista de llamados de la barra. La usan barra.html y admin.html. */
(function () {
    function hace(hora) {
        var t = Date.parse(hora);
        if (isNaN(t)) return hora ? String(hora) : '';
        var min = Math.max(0, Math.round((Date.now() - t) / 60000));
        if (min < 1) return 'hace un momento';
        if (min === 1) return 'hace 1 min';
        if (min < 60) return 'hace ' + min + ' min';
        var horas = Math.round(min / 60);
        if (horas === 1) return 'hace 1 h';
        return 'hace ' + horas + ' h';
    }

    function ejemplos() {
        var ahora = Date.now();
        return [
            { id: 'ej-14', mesa: '14', hora: new Date(ahora - 60000).toISOString(), estado: 'pendiente' },
            { id: 'ej-8', mesa: '8', hora: new Date(ahora - 8 * 60000).toISOString(), estado: 'pendiente' }
        ];
    }

    function montar(opts) {
        var clave = opts.clave || '';
        var demo = !!opts.demo;
        var lista = opts.lista;
        var vacio = opts.vacio;
        var sonidoBtn = opts.sonidoBtn;
        var poll = 0;
        var vistos = null;
        var audioCtx = null;
        var sonidoOn = false;
        var demoLista = demo ? ejemplos() : null;
        var parado = false;

        function parar() {
            parado = true;
            if (poll) {
                clearInterval(poll);
                poll = 0;
            }
        }

        function pitar() {
            if (!audioCtx) return;
            var osc = audioCtx.createOscillator();
            var gan = audioCtx.createGain();
            var ahora = audioCtx.currentTime;
            osc.type = 'sine';
            osc.frequency.value = 880;
            gan.gain.setValueAtTime(0.0001, ahora);
            gan.gain.exponentialRampToValueAtTime(0.08, ahora + 0.02);
            gan.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.22);
            osc.connect(gan);
            gan.connect(audioCtx.destination);
            osc.start(ahora);
            osc.stop(ahora + 0.24);
        }

        function pintar(llamados) {
            var pendientes = (llamados || []).filter(function (item) {
                return item && item.estado !== 'listo';
            });
            pendientes.sort(function (a, b) {
                return Date.parse(a.hora) - Date.parse(b.hora);
            });
            var ids = pendientes.map(function (item) { return String(item.id); });
            if (vistos && sonidoOn) {
                var hayNuevo = ids.some(function (id) { return vistos.indexOf(id) === -1; });
                if (hayNuevo) pitar();
            }
            vistos = ids;
            lista.innerHTML = '';
            pendientes.forEach(function (item) {
                var art = document.createElement('article');
                art.className = 'tarjeta';
                var titulo = document.createElement('h2');
                titulo.textContent = 'Mesa ' + item.mesa + ' · ' + hace(item.hora);
                var boton = document.createElement('button');
                boton.type = 'button';
                boton.className = 'listo';
                boton.textContent = 'Listo';
                boton.addEventListener('click', function () { marcar(item.id, boton); });
                art.appendChild(titulo);
                art.appendChild(boton);
                lista.appendChild(art);
            });
            if (vacio) vacio.hidden = pendientes.length > 0;
        }

        function alRecibir(data, primera) {
            if (data && data.ok === true && Array.isArray(data.llamados)) {
                if (opts.onOk) opts.onOk();
                pintar(data.llamados);
                return true;
            }
            if (data && data.ok === false) {
                var codigo = data.error ? String(data.error) : '';
                if (!codigo || codigo === 'clave_invalida') {
                    parar();
                    if (opts.onClaveMala) opts.onClaveMala();
                    return false;
                }
                parar();
                if (opts.onFallo) opts.onFallo('leer');
                return false;
            }
            if (primera && opts.onFallo) opts.onFallo('red');
            return false;
        }

        function consultar(primera) {
            if (parado) return Promise.resolve(false);
            if (demo) {
                if (opts.onOk) opts.onOk();
                pintar(demoLista);
                return Promise.resolve(true);
            }
            return window.BRUMA_LLAMADOS.llamados(clave, function () {
                if (opts.alReintentar) opts.alReintentar();
            }).then(function (data) {
                if (parado) return false;
                return alRecibir(data, primera);
            }).catch(function () {
                if (primera && opts.onFallo) opts.onFallo('red');
                return false;
            });
        }

        function marcar(id, boton) {
            if (demo) {
                demoLista = demoLista.filter(function (item) { return String(item.id) !== String(id); });
                pintar(demoLista);
                return;
            }
            boton.disabled = true;
            window.BRUMA_LLAMADOS.listo(id, clave).then(function (data) {
                if (!data || data.ok === false) {
                    boton.disabled = false;
                    var codigo = data && data.error ? String(data.error) : '';
                    if (data && data.ok === false && (!codigo || codigo === 'clave_invalida')) {
                        parar();
                        if (opts.onClaveMala) opts.onClaveMala();
                    }
                    return;
                }
                if (data.ok !== true) {
                    boton.disabled = false;
                    return;
                }
                consultar(false);
            }).catch(function () {
                boton.disabled = false;
            });
        }

        if (sonidoBtn) {
            sonidoBtn.onclick = function () {
                var AC = window.AudioContext || window.webkitAudioContext;
                if (!AC) return;
                audioCtx = audioCtx || new AC();
                if (audioCtx.state === 'suspended') audioCtx.resume();
                sonidoOn = true;
                sonidoBtn.textContent = 'Sonido activado';
                sonidoBtn.setAttribute('aria-pressed', 'true');
            };
        }

        consultar(true).then(function (ok) {
            if (!ok || demo || parado) return;
            poll = setInterval(function () { consultar(false); }, 4000);
        });

        return { parar: parar };
    }

    window.BRUMA_SALA = { montar: montar };
})();
