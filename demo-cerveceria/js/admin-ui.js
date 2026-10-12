/* Pantalla del personal. El aspecto es el de la página. */
(function () {
    var CLAVE_GUARDADA = 'bruma-clave-barra';
    var DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
    var LISTO_CARTA = 'Listo. Se ve en la carta en unos minutos';

    var claveActual = '';
    var modo = { reservas: false, llamados: false, carta: false, happy: false };
    var vista = 'clave';
    var salaCtrl = null;
    var preguntando = null;
    var mesaElegida = '';
    var personas = 2;
    var cartaActual = [];
    var reservasActual = [];
    var poll = 0;

    var form = document.getElementById('vista-clave');
    var campoClave = document.getElementById('clave');
    var errorClave = document.getElementById('clave-error');
    var esperaClave = document.getElementById('clave-espera');

    function leerClave() {
        try { return localStorage.getItem(CLAVE_GUARDADA) || ''; }
        catch (error) { return ''; }
    }

    function guardarClave(valor) {
        try { localStorage.setItem(CLAVE_GUARDADA, valor); }
        catch (error) {}
    }

    function borrarClave() {
        try { localStorage.removeItem(CLAVE_GUARDADA); }
        catch (error) {}
        try { sessionStorage.removeItem(CLAVE_GUARDADA); }
        catch (error) {}
    }

    function $(id) { return document.getElementById(id); }

    function mostrar(nombre) {
        vista = nombre;
        Array.prototype.forEach.call(document.querySelectorAll('[data-vista]'), function (nodo) {
            nodo.hidden = nodo.getAttribute('data-vista') !== nombre;
        });
        if (nombre !== 'llamados') pararSala();
        if (nombre !== 'reservas') preguntando = null;
    }

    function pintarEjemplo() {
        var inicio = $('ejemplo-inicio');
        if (inicio) inicio.hidden = !(modo.reservas || modo.llamados || modo.carta || modo.happy);
        Array.prototype.forEach.call(document.querySelectorAll('[data-ejemplo]'), function (nodo) {
            var cual = nodo.getAttribute('data-ejemplo');
            nodo.hidden = !modo[cual];
        });
    }

    function pararSala() {
        if (salaCtrl) {
            salaCtrl.parar();
            salaCtrl = null;
        }
    }

    function claveMala() {
        pararSala();
        borrarClave();
        claveActual = '';
        campoClave.value = '';
        errorClave.hidden = false;
        errorClave.textContent = 'Clave incorrecta';
        if (esperaClave) esperaClave.hidden = true;
        mostrar('clave');
        campoClave.focus();
    }

    function alReintentar() {
        var aviso = $('aviso-' + vista);
        var texto = 'Un momento…';
        if (vista === 'clave' && esperaClave) {
            esperaClave.hidden = false;
            esperaClave.textContent = texto;
            return;
        }
        if (aviso) {
            aviso.hidden = false;
            aviso.textContent = texto;
        }
    }

    function entrar(clave) {
        claveActual = clave;
        errorClave.hidden = true;
        if (esperaClave) {
            esperaClave.hidden = false;
            esperaClave.textContent = 'Un momento…';
        }
        window.BRUMA_ADMIN.entrar(clave, alReintentar).then(function (res) {
            if (esperaClave) esperaClave.hidden = true;
            if (!res || res.ok === false) {
                if (res && res.error === 'clave_invalida') claveMala();
                else {
                    errorClave.hidden = false;
                    errorClave.textContent = 'No se pudo entrar.';
                    mostrar('clave');
                }
                return;
            }
            modo.reservas = !!res.demoReservas;
            modo.llamados = !!res.demoLlamados;
            modo.carta = false;
            modo.happy = false;
            if (res.guardarClave) guardarClave(claveActual);
            else borrarClave();
            campoClave.value = '';
            pintarEjemplo();
            mostrar('inicio');
        }).catch(function () {
            if (esperaClave) esperaClave.hidden = true;
            errorClave.hidden = false;
            errorClave.textContent = 'No se pudo entrar.';
            mostrar('clave');
        });
    }

    function diaCorto(iso) {
        var p = String(iso || '').split('-');
        if (p.length < 3) return '';
        var t = Date.UTC(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
        if (isNaN(t)) return '';
        return DIAS[new Date(t).getUTCDay()] || '';
    }

    function horaCorta(valor) {
        var m = String(valor || '').match(/^(\d{1,2}):(\d{2})/);
        if (!m) return String(valor || '');
        var h = m[1].length === 1 ? '0' + m[1] : m[1];
        return h + ':' + m[2];
    }

    function gente(n) {
        var x = Number(n);
        if (x === 1) return '1 persona';
        return (isFinite(x) ? x : 0) + ' personas';
    }

    function linea(reserva) {
        return 'Mesa ' + reserva.mesa + ' · ' + diaCorto(reserva.fecha) + ' ' + horaCorta(reserva.hora) + ' · ' + gente(reserva.personas) + ' · ' + reserva.nombre;
    }

    function telHref(tel) {
        var d = String(tel || '').replace(/[^\d]/g, '');
        if (!d) return '';
        if (d.indexOf('56') !== 0) d = '56' + d;
        return '+' + d;
    }

    function telTexto(tel) {
        var d = telHref(tel).replace(/\D/g, '');
        if (d.indexOf('56') === 0 && d.length >= 11) {
            var resto = d.slice(3);
            return '+56 ' + d.charAt(2) + ' ' + resto.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
        }
        return telHref(tel);
    }

    function esConfirmada(estado) {
        var s = String(estado || '').toLowerCase();
        return s === 'confirmada' || s === 'confirmado';
    }

    function avisoReservas(texto) {
        var nodo = $('aviso-reservas');
        if (!texto) {
            nodo.hidden = true;
            nodo.textContent = '';
            return;
        }
        nodo.hidden = false;
        nodo.textContent = texto;
    }

    function boton(clase, texto, alClick) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = clase;
        b.textContent = texto;
        b.addEventListener('click', alClick);
        return b;
    }

    function pintarReservas() {
        var hoy = window.BRUMA_ADMIN.fechaChile(new Date());
        var pendientes = [];
        var hoyConfirmadas = [];
        reservasActual.forEach(function (reserva) {
            if (!reserva || !reserva.nombre && !reserva.mesa) return;
            if (reserva.fecha && String(reserva.fecha) < hoy) return;
            if (esConfirmada(reserva.estado)) {
                if (String(reserva.fecha) === hoy) hoyConfirmadas.push(reserva);
                return;
            }
            pendientes.push(reserva);
        });
        var lista = $('lista-pendientes');
        var vacio = $('vacio-pendientes');
        lista.innerHTML = '';
        pendientes.forEach(function (reserva) {
            lista.appendChild(tarjetaReserva(reserva, true));
        });
        vacio.hidden = pendientes.length > 0;
        var caja = $('confirmadas');
        var listaHoy = $('lista-confirmadas');
        listaHoy.innerHTML = '';
        hoyConfirmadas.forEach(function (reserva) {
            listaHoy.appendChild(tarjetaReserva(reserva, false));
        });
        caja.hidden = hoyConfirmadas.length === 0;
    }

    function tarjetaReserva(reserva, pendiente) {
        var art = document.createElement('article');
        art.className = 'tarjeta';
        var titulo = document.createElement('h2');
        titulo.textContent = linea(reserva);
        art.appendChild(titulo);
        var href = telHref(reserva.telefono);
        if (href) {
            var tel = document.createElement('a');
            tel.className = 'telefono';
            tel.href = 'tel:' + href;
            tel.textContent = telTexto(reserva.telefono);
            art.appendChild(tel);
        }
        if (!pendiente) return art;
        if (preguntando === String(reserva.id)) {
            var pregunta = document.createElement('p');
            pregunta.className = 'pregunta';
            pregunta.textContent = '¿Rechazar?';
            art.appendChild(pregunta);
            art.appendChild(boton('btn btn-wa', 'Sí', function () { hacerRechazo(reserva.id); }));
            art.appendChild(boton('btn btn-gris', 'No', function () {
                preguntando = null;
                pintarReservas();
            }));
            return art;
        }
        art.appendChild(boton('btn btn-wa', 'Confirmar', function () { hacerConfirmar(reserva.id); }));
        art.appendChild(boton('btn btn-gris', 'Rechazar', function () {
            preguntando = String(reserva.id);
            pintarReservas();
        }));
        return art;
    }

    function cargarReservas(silencioso) {
        return window.BRUMA_ADMIN.reservas(claveActual, modo.reservas, alReintentar).then(function (data) {
            if (data && data.demo) {
                modo.reservas = true;
                pintarEjemplo();
            }
            if (data && data.ok === true && Array.isArray(data.reservas)) {
                if (!silencioso) avisoReservas('');
                reservasActual = data.reservas;
                if (vista === 'reservas') pintarReservas();
                return;
            }
            if (data && (data.error === 'clave_invalida' || data.ok === false && !data.error)) {
                claveMala();
                return;
            }
            if (!silencioso) avisoReservas('No se pudo leer.');
        });
    }

    function hacerConfirmar(id) {
        window.BRUMA_ADMIN.confirmar(id, claveActual, modo.reservas).then(function (data) {
            if (data && data.ok === true) {
                preguntando = null;
                cargarReservas(true);
                return;
            }
            if (data && (data.error === 'clave_invalida' || data.ok === false && !data.error)) claveMala();
            else avisoReservas('No se pudo.');
        });
    }

    function hacerRechazo(id) {
        window.BRUMA_ADMIN.rechazar(id, claveActual, modo.reservas).then(function (data) {
            if (data && data.ok === true) {
                preguntando = null;
                cargarReservas(true);
                return;
            }
            if (data && (data.error === 'clave_invalida' || data.ok === false && !data.error)) claveMala();
            else avisoReservas('No se pudo.');
        });
    }

    function pesos(n) {
        var x = Number(String(n == null ? '' : n).replace(/[^\d]/g, ''));
        if (!x) return '';
        return '$' + x.toLocaleString('es-CL');
    }

    function ofertaNumero(valor) {
        var x = Number(String(valor == null ? '' : valor).replace(/[^\d]/g, ''));
        return x || 0;
    }

    function leerPrecio(texto) {
        var s = String(texto || '').trim().replace(/\$/g, '').replace(/\s/g, '');
        if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
        if (!/^[1-9]\d*$/.test(s)) return { ok: false };
        return { ok: true, valor: Number(s) };
    }

    function avisoCarta(texto) {
        var nodo = $('aviso-carta');
        if (!texto) {
            nodo.hidden = true;
            nodo.textContent = '';
            return;
        }
        nodo.hidden = false;
        nodo.textContent = texto;
    }

    function aplicarCarta(item, cambios, fila) {
        if (cambios.disponible != null) item.disponible = cambios.disponible;
        if (cambios.precio != null) item.precio = cambios.precio;
        if (cambios.precio_oferta != null) item.precio_oferta = cambios.precio_oferta;
        if (fila != null && fila !== '') item.fila = fila;
    }

    function enviarCarta(item, cambios) {
        cambios.nombre = item.nombre;
        avisoCarta('Un momento…');
        return window.BRUMA_ADMIN.guardarCarta(claveActual, cambios, modo.carta).then(function (data) {
            if (data && data.ok === true) {
                aplicarCarta(item, cambios, data.fila);
                pintarCarta();
                avisoCarta(LISTO_CARTA);
                return;
            }
            if (data && data.error === 'clave_invalida') {
                claveMala();
                return;
            }
            avisoCarta(window.BRUMA_ADMIN.frase(data && data.error));
            pintarCarta();
        });
    }

    function controlPrecio(etiqueta, actual, campo, item) {
        var botonPrecio = document.createElement('button');
        botonPrecio.type = 'button';
        botonPrecio.className = 'precio';
        botonPrecio.textContent = pesos(actual) || 'Precio';
        botonPrecio.setAttribute('aria-label', etiqueta + ' ' + (item.nombre || ''));
        botonPrecio.addEventListener('click', function () {
            abrirPrecio(botonPrecio, ofertaNumero(actual), campo, item, etiqueta);
        });
        return botonPrecio;
    }

    function abrirPrecio(botonPrecio, actual, campo, item, etiqueta) {
        var input = document.createElement('input');
        input.className = 'precio-input';
        input.setAttribute('inputmode', 'numeric');
        input.setAttribute('enterkeyhint', 'done');
        input.setAttribute('aria-label', etiqueta + ' ' + (item.nombre || ''));
        input.value = actual ? String(actual) : '';
        botonPrecio.replaceWith(input);
        input.focus();
        var cerrado = false;
        var igualExplicito = false;
        var cancelar = false;
        function cerrar() {
            if (cerrado) return;
            cerrado = true;
            if (cancelar) {
                pintarCarta();
                return;
            }
            var leido = leerPrecio(input.value);
            if (!leido.ok) {
                avisoCarta(window.BRUMA_ADMIN.frase(campo === 'precio_oferta' ? 'precio_oferta_invalido' : 'precio_invalido'));
                cerrado = false;
                input.focus();
                return;
            }
            if (leido.valor === Number(actual)) {
                if (igualExplicito) avisoCarta(window.BRUMA_ADMIN.frase('sin_cambios'));
                pintarCarta();
                return;
            }
            var cambios = { nombre: item.nombre };
            cambios[campo] = leido.valor;
            enviarCarta(item, cambios);
        }
        input.addEventListener('keydown', function (evento) {
            if (evento.key === 'Enter') {
                evento.preventDefault();
                igualExplicito = true;
                input.blur();
            } else if (evento.key === 'Escape') {
                evento.preventDefault();
                cancelar = true;
                input.blur();
            }
        });
        input.addEventListener('blur', function () {
            window.setTimeout(cerrar, 0);
        });
    }

    function pintarCarta() {
        var lista = $('lista-carta');
        var aviso = $('aviso-carta');
        var texto = aviso.textContent;
        var visible = !aviso.hidden;
        lista.innerHTML = '';
        cartaActual.forEach(function (item) {
            if (!item || !item.nombre) return;
            lista.appendChild(tarjetaCarta(item));
        });
        if (visible && texto) avisoCarta(texto);
    }

    function tarjetaCarta(item) {
        var art = document.createElement('article');
        art.className = 'tarjeta';
        var titulo = document.createElement('h2');
        titulo.textContent = item.nombre;
        art.appendChild(titulo);
        var grupo = document.createElement('div');
        grupo.className = 'interruptor';
        grupo.setAttribute('role', 'group');
        grupo.setAttribute('aria-label', item.nombre);
        var estaAgotado = window.BRUMA_ADMIN.agotado(item.disponible);
        grupo.appendChild(botonEstado('Hay', !estaAgotado, function () {
            if (!estaAgotado) return;
            enviarCarta(item, { disponible: window.BRUMA_ADMIN.disponibleHay });
        }));
        grupo.appendChild(botonEstado('Agotado', estaAgotado, function () {
            if (estaAgotado) return;
            enviarCarta(item, { disponible: window.BRUMA_ADMIN.disponibleNo });
        }));
        art.appendChild(grupo);
        art.appendChild(controlPrecio('Precio', item.precio, 'precio', item));
        var oferta = ofertaNumero(item.precio_oferta);
        if (oferta) {
            var fila = document.createElement('div');
            fila.className = 'oferta';
            fila.appendChild(controlPrecio('Oferta', oferta, 'precio_oferta', item));
            fila.appendChild(boton('btn btn-linea', 'Quitar oferta', function () {
                enviarCarta(item, { precio_oferta: '' });
            }));
            art.appendChild(fila);
        }
        return art;
    }

    function botonEstado(texto, activo, alClick) {
        var b = boton(activo ? 'estado activo' : 'estado', texto, alClick);
        b.setAttribute('aria-pressed', activo ? 'true' : 'false');
        return b;
    }

    function cargarCarta() {
        avisoCarta('');
        return window.BRUMA_ADMIN.carta(claveActual, modo.carta, alReintentar).then(function (data) {
            if (data && data.demo) {
                modo.carta = true;
                pintarEjemplo();
            } else if (data && data.ok === true) {
                modo.carta = false;
                pintarEjemplo();
            }
            if (data && data.ok === true && Array.isArray(data.carta)) {
                cartaActual = data.carta;
                pintarCarta();
                return;
            }
            if (data && data.error === 'clave_invalida') claveMala();
            else avisoCarta('No se pudo leer.');
        });
    }

    // ---------- Happy hour ----------
    var DIAS_HAPPY = ['lun', 'mar', 'mie', 'jue', 'vie', 'sab', 'dom'];
    var DIAS_HAPPY_TXT = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    var happyActual = null;
    var diasElegidos = [];

    function avisoHappy(texto) {
        var nodo = $('aviso-happy');
        nodo.hidden = !texto;
        nodo.textContent = texto || '';
    }

    // «lun-jue» o «lun,mie,vie» -> [0, 1, 2, 3] (0 = lunes)
    function leerDias(texto) {
        var lista = [];
        String(texto || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .split(',').forEach(function (parte) {
                var r = parte.trim().split('-');
                var a = DIAS_HAPPY.indexOf(r[0].slice(0, 3));
                var b = r.length > 1 ? DIAS_HAPPY.indexOf(r[1].slice(0, 3)) : a;
                if (a < 0 || b < 0) return;
                for (var i = a, g = 0; g < 7; i = (i + 1) % 7, g += 1) {
                    if (lista.indexOf(i) === -1) lista.push(i);
                    if (i === b) break;
                }
            });
        return lista.sort();
    }

    function escribirDias(lista) {
        var orden = lista.slice().sort();
        var seguidos = orden.length > 1 && orden.every(function (d, i) { return i === 0 || d === orden[i - 1] + 1; });
        if (seguidos) return DIAS_HAPPY[orden[0]] + '-' + DIAS_HAPPY[orden[orden.length - 1]];
        return orden.map(function (d) { return DIAS_HAPPY[d]; }).join(',');
    }

    function pintarHappyAdmin() {
        var h = happyActual;
        var encendido = h.activo !== 'no';
        var grupo = $('happy-interruptor');
        grupo.innerHTML = '';
        grupo.appendChild(botonEstado('Encendido', encendido, function () {
            if (!encendido) enviarHappy({ activo: 'si' }, 'Listo. Happy hour encendido');
        }));
        grupo.appendChild(botonEstado('Apagado', !encendido, function () {
            if (encendido) enviarHappy({ activo: 'no' }, 'Listo. Happy hour apagado');
        }));
        var caja = $('happy-dias');
        caja.innerHTML = '';
        DIAS_HAPPY_TXT.forEach(function (txt, i) {
            var elegido = diasElegidos.indexOf(i) !== -1;
            var b = boton(elegido ? 'mesa elegida' : 'mesa apagada', txt, function () {
                if (elegido) diasElegidos = diasElegidos.filter(function (d) { return d !== i; });
                else diasElegidos.push(i);
                pintarHappyAdmin();
            });
            b.setAttribute('aria-pressed', elegido ? 'true' : 'false');
            caja.appendChild(b);
        });
        $('happy-estado').textContent = encendido
            ? 'Los clientes ven el happy hour.'
            : 'Apagado: los clientes no ven el happy hour.';
    }

    function enviarHappy(cambios, listo) {
        avisoHappy('Un momento…');
        window.BRUMA_ADMIN.guardarHappy(claveActual, cambios, modo.happy).then(function (data) {
            if (data && data.ok === true) {
                if (data.happy) happyActual = data.happy;
                else Object.keys(cambios).forEach(function (k) { happyActual[k] = cambios[k]; });
                diasElegidos = leerDias(happyActual.dias);
                pintarHappyAdmin();
                avisoHappy(listo + '. Se ve en la página en unos minutos');
                return;
            }
            if (data && data.error === 'clave_invalida') { claveMala(); return; }
            avisoHappy(window.BRUMA_ADMIN.frase(data && data.error));
        });
    }

    function guardarHorario() {
        if (!diasElegidos.length) { avisoHappy('Elige al menos un día'); return; }
        var inicio = $('happy-inicio').value;
        var fin = $('happy-fin').value;
        if (!inicio || !fin) { avisoHappy('Escribe la hora de inicio y de término'); return; }
        enviarHappy({ dias: escribirDias(diasElegidos), inicio: inicio, fin: fin }, 'Listo. Horario guardado');
    }

    function abrirHappy() {
        mostrar('happy');
        avisoHappy('');
        window.BRUMA_ADMIN.happy(claveActual, modo.happy, alReintentar).then(function (data) {
            if (data && data.ok === true && data.happy) {
                modo.happy = !!data.demo;
                pintarEjemplo();
                happyActual = data.happy;
                diasElegidos = leerDias(happyActual.dias);
                $('happy-inicio').value = happyActual.inicio || '';
                $('happy-fin').value = happyActual.fin || '';
                avisoHappy('');
                pintarHappyAdmin();
                return;
            }
            if (data && data.error === 'clave_invalida') claveMala();
            else avisoHappy('No se pudo leer.');
        });
    }

    $('happy-guardar').addEventListener('click', guardarHorario);

    function mesasLibres() {
        var lista = window.BRUMA_MESAS;
        if (!lista || !lista.length) {
            var n;
            var fallback = [];
            for (n = 1; n <= 8; n += 1) fallback.push(String(n));
            return fallback;
        }
        return lista.filter(function (mesa) {
            if (mesa.estado === 'reservada') return false;
            if (mesa.ocupada_ahora) return false;
            if (typeof window.brumaVisitaOcupa === 'function' && window.brumaVisitaOcupa(mesa.mesa)) return false;
            if (window.BRUMA_ADMIN.ocupaMesa(mesa.mesa)) return false;
            return true;
        }).map(function (mesa) { return String(mesa.mesa); });
    }

    function pintarLlegada() {
        var caja = $('mesas-libre');
        caja.innerHTML = '';
        var libres = mesasLibres();
        if (mesaElegida && libres.indexOf(mesaElegida) === -1) mesaElegida = '';
        libres.forEach(function (numero) {
            var b = boton(numero === mesaElegida ? 'mesa elegida' : 'mesa', numero, function () {
                mesaElegida = numero;
                pintarLlegada();
            });
            b.setAttribute('aria-pressed', numero === mesaElegida ? 'true' : 'false');
            caja.appendChild(b);
        });
        $('personas-num').textContent = String(personas);
        $('sin-mesas').hidden = libres.length > 0;
    }

    function abrirLlegada() {
        mesaElegida = '';
        personas = 2;
        var aviso = $('aviso-llegada');
        aviso.hidden = true;
        pintarLlegada();
        mostrar('llegada');
    }

    function anotarLlegada() {
        var aviso = $('aviso-llegada');
        if (!mesaElegida) {
            aviso.hidden = false;
            aviso.textContent = 'Elige una mesa';
            return;
        }
        aviso.hidden = false;
        aviso.textContent = 'Un momento…';
        window.BRUMA_ADMIN.sinReserva(mesaElegida, personas, claveActual, modo.reservas).then(function (data) {
            if (data && data.ok === true) {
                mostrar('reservas');
                avisoReservas('Listo.');
                cargarReservas(true);
                return;
            }
            if (data && (data.error === 'clave_invalida' || data.ok === false && !data.error)) claveMala();
            else {
                aviso.hidden = false;
                aviso.textContent = 'No se pudo anotar.';
            }
        });
    }

    function abrirLlamados() {
        mostrar('llamados');
        var aviso = $('aviso-llamados');
        aviso.hidden = true;
        pararSala();
        salaCtrl = window.BRUMA_SALA.montar({
            clave: claveActual,
            demo: modo.llamados,
            lista: $('lista-llamados'),
            vacio: $('vacio-llamados'),
            sonidoBtn: $('sonido'),
            alReintentar: function () {
                aviso.hidden = false;
                aviso.textContent = 'Un momento…';
            },
            onOk: function () {
                aviso.hidden = true;
            },
            onClaveMala: claveMala,
            onFallo: function () {
                aviso.hidden = false;
                aviso.textContent = 'No se pudo leer los llamados.';
            }
        });
    }

    function abrirReservas() {
        mostrar('reservas');
        cargarReservas(false);
    }

    function abrirCarta() {
        mostrar('carta');
        cargarCarta();
    }

    document.querySelectorAll('[data-ir]').forEach(function (botonIr) {
        botonIr.addEventListener('click', function () {
            var destino = botonIr.getAttribute('data-ir');
            if (destino === 'reservas') abrirReservas();
            else if (destino === 'llamados') abrirLlamados();
            else if (destino === 'carta') abrirCarta();
            else if (destino === 'happy') abrirHappy();
            else if (destino === 'llegada') abrirLlegada();
            else if (destino === 'inicio') mostrar('inicio');
        });
    });

    form.addEventListener('submit', function (evento) {
        evento.preventDefault();
        entrar(campoClave.value);
    });

    $('cambiar').addEventListener('click', function () {
        borrarClave();
        claveActual = '';
        campoClave.value = '';
        errorClave.hidden = true;
        if (esperaClave) esperaClave.hidden = true;
        mostrar('clave');
        campoClave.focus();
    });

    $('salir').addEventListener('click', function () {
        $('salir').hidden = true;
        $('salir-confirma').hidden = false;
    });
    $('salir-no').addEventListener('click', function () {
        $('salir-confirma').hidden = true;
        $('salir').hidden = false;
    });
    $('salir-si').addEventListener('click', function () {
        $('salir-confirma').hidden = true;
        $('salir').hidden = false;
        borrarClave();
        claveActual = '';
        campoClave.value = '';
        errorClave.hidden = true;
        if (esperaClave) esperaClave.hidden = true;
        mostrar('clave');
        campoClave.focus();
    });

    $('personas-menos').addEventListener('click', function () {
        if (personas > 1) personas -= 1;
        pintarLlegada();
    });
    $('personas-mas').addEventListener('click', function () {
        if (personas < 12) personas += 1;
        pintarLlegada();
    });
    $('llegada-listo').addEventListener('click', anotarLlegada);

    window.addEventListener('bruma:mesas', function () {
        if (vista === 'llegada') pintarLlegada();
    });
    window.addEventListener('bruma:ocupadas', function () {
        if (vista === 'llegada') pintarLlegada();
    });

    poll = setInterval(function () {
        if (vista !== 'reservas' || preguntando) return;
        cargarReservas(true);
    }, 15000);

    var guardada = leerClave();
    if (guardada) entrar(guardada);
})();
