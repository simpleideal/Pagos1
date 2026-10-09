/* Mesas de ejemplo, solo si el otro cambio todavía no cargó datos.
   Esa parte deja el arreglo en window.BRUMA_MESAS y avisa con
   el evento bruma:mesas. Cuando exista, este archivo no lo pisa.
   Ids de escena: barra, mesas, terraza, mesas-pano.
   Una zona mesas se muestra en el 360 y en la panorámica. */
(function () {
    if (window.BRUMA_MESAS && window.BRUMA_MESAS.length) return;
    window.BRUMA_MESAS = [
        { mesa: 1, zona: 'barra', capacidad: 2, estado: 'libre', yaw: 8, pitch: -14, nota: 'En la barra' },
        { mesa: 5, zona: 'barra', capacidad: 6, estado: 'reservada', yaw: -14, pitch: -20, nota: '' },
        { mesa: 4, zona: 'mesas', capacidad: 4, estado: 'libre', yaw: -18, pitch: -12, nota: 'Centro del salón' },
        { mesa: 2, zona: 'mesas', capacidad: 4, estado: 'reservada', yaw: -32, pitch: -18, nota: 'Junto a la ventana' },
        { mesa: 3, zona: 'terraza', capacidad: 4, estado: 'libre', yaw: -22, pitch: -14, nota: 'Afuera' },
        { mesa: 6, zona: 'terraza', capacidad: 2, estado: 'libre', yaw: -36, pitch: -10, nota: '' }
    ];
    window.dispatchEvent(new Event('bruma:mesas'));
})();
