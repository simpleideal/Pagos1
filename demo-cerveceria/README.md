# Recorrido 360

La sección `#tour-360` de la muestra usa fotos de ejemplo, no del local.
Las tres escenas del plano (barra, mesas, terraza) son panoramas 360×180.

Las fotos grandes están en `img/360/` (`barra.jpg`, `mesas.jpg`, `terraza.jpg`),
cerca de 4096×2048. En pantallas de hasta 720px de ancho la página pide la
versión `*-movil.jpg` (cerca de 2048×1024). Solo se descarga la escena que
se está mirando.

## Sumar una foto 360 completa

1. Guarda la equirectangular en `img/360/nombre.jpg` y una más liviana en
   `img/360/nombre-movil.jpg`.
2. En el script de `#tour-360`, agrega una entrada sin `tipo`:

```js
patio: {
    archivo: 'patio',
    etiqueta: 'Patio',
    frase: 'el patio',
    yaw: 10,
    pitch: -8,
    hfov: 100
}
```

`yaw` y `pitch` marcan el objeto (la etiqueta) y también la vista inicial.

## Sumar una panorámica de teléfono

Una foto del teléfono no cubre 360×180. No hay que estirarla: se declara
como panorámica parcial.

1. Guarda el archivo igual que arriba (`img/360/nombre.jpg` y `nombre-movil.jpg`).
2. Mide el ángulo vertical de la toma, `vertical` (vaov). En el teléfono
   suele estar entre 60° y 90°.
3. No escribas el ángulo horizontal. La página lo calcula con el aspecto
   de la imagen:

```text
haov ≈ vertical × (ancho / alto)
```

4. Configura la escena así:

```js
patio: {
    archivo: 'patio',
    etiqueta: 'Patio',
    frase: 'el patio',
    tipo: 'panoramica',
    vertical: 75,
    desfase: 0,
    yaw: 0,
    pitch: 0,
    hfov: 58
}
```

`desfase` es el vOffset de Pannellum: 0 deja el horizonte en el centro de
la foto. Un valor negativo baja ese centro.

Si `haov` sale menor que 360, el visor se detiene en los bordes:
`minYaw`/`maxYaw` en ±haov/2 y `minPitch`/`maxPitch` en
`desfase ± vertical/2`.

La barra de esta muestra (`barra.jpg`) es el panorama completo de
Bier macht Schön, Colonia (Maximilian Schönherr, CC BY-SA 4.0). Solo se
achica para la página: no se recorta.

Las mesas tienen, además, una simulación: `mesas-pano.jpg` es un recorte
CC0 de esa foto 360 (~200° de ancho por ~65° de alto, centrado en una
mesa). El interruptor «Panorámica de teléfono» la carga en la escena
Mesas. No es una zona nueva del plano.
