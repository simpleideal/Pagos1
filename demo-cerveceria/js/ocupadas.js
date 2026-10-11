/* Mesas ocupadas por una visita sin reserva.
   GET ?accion=ocupadas -> {ok, ocupadas:[{mesa, fecha, desde, hasta}]}
   Si el pedido falla o la acción no está publicada, no se inventa ocupación. */
(function () {
    function urlScript() {
        return String(typeof RESERVAS_URL === 'string' ? RESERVAS_URL : '').trim();
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

    function enRango(minutos, desde, hasta) {
        if (desde <= hasta) return minutos >= desde && minutos <= hasta;
        return minutos >= desde || minutos <= hasta;
    }

    function ahoraChile(date) {
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
        fmt.formatToParts(date || new Date()).forEach(function (p) {
            if (p.type !== 'literal') partes[p.type] = p.value;
        });
        var hora = Number(partes.hour);
        if (hora === 24) hora = 0;
        return {
            fecha: partes.year + '-' + partes.month + '-' + partes.day,
            minutos: hora * 60 + Number(partes.minute)
        };
    }

    function visitaOcupa(mesa, hora) {
        var lista = window.BRUMA_OCUPADAS;
        if (!Array.isArray(lista)) return false;
        var chile = ahoraChile(new Date());
        var minutos = hora ? minutosDe(hora) : chile.minutos;
        if (minutos == null) return false;
        var cuando = { fecha: chile.fecha, minutos: minutos };
        var i;
        for (i = 0; i < lista.length; i += 1) {
            var item = lista[i];
            if (!item || String(item.mesa) !== String(mesa)) continue;
            if (item.fecha && String(item.fecha) !== cuando.fecha) continue;
            var desde = minutosDe(item.desde);
            var hasta = minutosDe(item.hasta);
            if (desde == null || hasta == null) continue;
            if (enRango(cuando.minutos, desde, hasta)) return true;
        }
        return false;
    }

    function publicar(lista) {
        window.BRUMA_OCUPADAS = lista;
        window.dispatchEvent(new CustomEvent('bruma:ocupadas', { detail: lista }));
    }

    function pedir() {
        if (!urlScript() || typeof window.brumaLeerScript !== 'function') return;
        var destino;
        try {
            destino = new URL(urlScript(), location.href);
        } catch (error) {
            return;
        }
        destino.searchParams.set('accion', 'ocupadas');
        window.brumaLeerScript(destino.toString(), { method: 'GET' }).then(function (data) {
            if (data && data.ok === true && Array.isArray(data.ocupadas)) publicar(data.ocupadas);
        });
    }

    window.brumaVisitaOcupa = visitaOcupa;
    pedir();
    setInterval(pedir, 60000);
})();
