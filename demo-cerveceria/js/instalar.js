/* Aviso para dejar Bruma Personal en la pantalla de inicio.
   No lee ni guarda la clave. */
(function () {
    var bloque = document.getElementById("instalar");
    var boton = document.getElementById("instalar-boton");
    var iphone = document.getElementById("instalar-iphone");
    var diferido = null;

    if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js").catch(function () {});
    }

    var sola = window.matchMedia("(display-mode: standalone)").matches ||
        window.navigator.standalone === true;
    if (sola) return;

    var ua = navigator.userAgent || "";
    var esIos = /iphone|ipad|ipod/i.test(ua) ||
        (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (esIos && iphone) iphone.hidden = false;

    window.addEventListener("beforeinstallprompt", function (event) {
        event.preventDefault();
        diferido = event;
        if (bloque) bloque.hidden = false;
    });

    if (boton) {
        boton.addEventListener("click", function () {
            if (!diferido) return;
            diferido.prompt();
            diferido.userChoice.then(function () {
                diferido = null;
                if (bloque) bloque.hidden = true;
            });
        });
    }
})();
