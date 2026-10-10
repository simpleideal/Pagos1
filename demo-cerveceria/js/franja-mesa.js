/* Franja fija cuando la página se abre con ?mesa=N. */
(function () {
    var franja = document.getElementById('llama-franja');
    if (!franja || !window.BRUMA_LLAMADOS) return;

    var mesa = '';
    try {
        mesa = String(new URLSearchParams(location.search).get('mesa') || '').trim();
    } catch (error) {
        mesa = '';
    }
    if (!mesa) return;

    var boton = document.getElementById('llama-boton');
    var estado = document.getElementById('llama-estado');
    var donde = document.getElementById('llama-donde');
    var demo = document.getElementById('llama-demo');
    var web = document.getElementById('llama-website');
    var poll = 0;
    var enviando = false;
    var idActivo = '';
    var desdeActivo = 0;
    var CLAVE_HASTA = 'bruma-llamar-hasta';
    var CLAVE_ID = 'bruma-llamar-id';
    var CLAVE_DESDE = 'bruma-llamar-desde';
    var DIEZ_MIN = 10 * 60 * 1000;
    var ESPERA = 60 * 1000;

    function leerNum(clave) {
        try { return Number(sessionStorage.getItem(clave) || 0); }
        catch (error) { return 0; }
    }

    function guardar(clave, valor) {
        try { sessionStorage.setItem(clave, String(valor)); }
        catch (error) {}
    }

    function borrar(clave) {
        try { sessionStorage.removeItem(clave); }
        catch (error) {}
    }

    function medir() {
        var alto = franja.getBoundingClientRect().height;
        if (alto < 8) return;
        document.documentElement.style.setProperty('--llama-alto', alto + 'px');
    }

    function decir(texto) {
        estado.textContent = texto || '';
        medir();
    }

    function enEspera() {
        return Date.now() < leerNum(CLAVE_HASTA);
    }

    function pintarBoton() {
        boton.disabled = enEspera() || enviando;
    }

    function parar() {
        if (poll) {
            clearInterval(poll);
            poll = 0;
        }
        idActivo = '';
    }

    function revisar() {
        if (!idActivo) return;
        var id = idActivo;
        if (Date.now() - desdeActivo > DIEZ_MIN) {
            parar();
            borrar(CLAVE_ID);
            borrar(CLAVE_DESDE);
            return;
        }
        window.BRUMA_LLAMADOS.llamado(id).then(function (data) {
            if (id !== idActivo) return;
            if (data && String(data.estado || '').toLowerCase() === 'listo') {
                parar();
                decir('El mesero va en camino');
                borrar(CLAVE_ID);
                borrar(CLAVE_DESDE);
            }
        }).catch(function () {});
    }

    function seguir(id, desde) {
        parar();
        idActivo = String(id);
        desdeActivo = desde;
        revisar();
        poll = setInterval(revisar, 5000);
    }

    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'visible') revisar();
    });
    window.addEventListener('storage', function (evento) {
        if (evento.key === 'bruma-llamados') revisar();
    });

    donde.textContent = 'Estás en la Mesa ' + mesa;
    if (window.BRUMA_LLAMADOS.esDemo()) demo.hidden = false;
    franja.hidden = false;
    document.documentElement.classList.add('con-llama');
    medir();
    window.addEventListener('resize', medir);
    if (window.MutationObserver) {
        var obs = new MutationObserver(medir);
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    }

    var idPrevio = '';
    try { idPrevio = sessionStorage.getItem(CLAVE_ID) || ''; }
    catch (error) {}
    var desdePrevio = leerNum(CLAVE_DESDE);
    if (idPrevio && desdePrevio && Date.now() - desdePrevio < DIEZ_MIN) {
        decir('Avisamos al mesero…');
        seguir(idPrevio, desdePrevio);
    }
    pintarBoton();
    if (enEspera()) setTimeout(pintarBoton, leerNum(CLAVE_HASTA) - Date.now());

    boton.addEventListener('click', function () {
        if (boton.disabled || enviando || enEspera()) return;
        enviando = true;
        pintarBoton();
        var website = web ? String(web.value || '') : '';
        window.BRUMA_LLAMADOS.llamar(mesa, website).then(function (data) {
            enviando = false;
            if (!data || data.ok === false || !data.id) {
                decir((data && data.error) ? String(data.error) : 'No pudimos avisar. Intenta de nuevo.');
                pintarBoton();
                return;
            }
            var ahora = Date.now();
            guardar(CLAVE_HASTA, ahora + ESPERA);
            guardar(CLAVE_ID, data.id);
            guardar(CLAVE_DESDE, ahora);
            decir('Avisamos al mesero…');
            pintarBoton();
            setTimeout(pintarBoton, ESPERA);
            seguir(data.id, ahora);
        }).catch(function () {
            enviando = false;
            decir('No pudimos avisar. Intenta de nuevo.');
            pintarBoton();
        });
    });
})();
