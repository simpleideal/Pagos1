# Cervecería Bruma

La página tiene tres pestañas: Inicio, Carta y Recorrido y reserva.
La portada (`img/fachada.jpg`) es la fachada del bar Sixty Four en NOMO,
Bacoor, Cavite — foto de UndueMarmot, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.es).
Solo se achicó (2000×1500). El nombre «Cervecería Bruma» va encima, con un degradado.
No es el local.

La carta y el happy hour siguen leyendo `datos/carta.csv` y
`datos/happy-hour.csv` (o la URL de `FUENTE`). Al entrar se ven la oferta
del día y cuatro cervezas; el resto se abre con «Ver carta completa».

En el inicio, el mapa es un cuadro chico junto a la dirección y el horario.
Carta, recorrido y contacto usan de fondo `img/fachada-fondo.jpg`
(la misma fachada, más chica, una sola vez).

La pestaña «Recorrido y reserva» junta el tour y el contacto.
`#reservar-mesa` queda vacío: el siguiente cambio pone ahí el botón,
cuando el 360 marque mesas y la reserva salga por WhatsApp.

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
2. Estima el ángulo vertical de la toma, `vertical` (vaov). En el teléfono
   suele estar entre 50° y 70°.
3. No escribas el ángulo horizontal. La página lo calcula con el aspecto
   de la imagen y no lo deja pasar de 360:

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
`desfase ± vertical/2`. Si el producto pasa de 360, queda en 360.

La barra de esta muestra (`barra.jpg`) es el panorama completo de
Bier macht Schön, Colonia (Maximilian Schönherr, CC BY-SA 4.0). Solo se
achica para la página: no se recorta.

En las mesas, «Panorámica de teléfono» abre otra foto: `mesas-pano.jpg`,
el interior de Barbara's Heritage Restaurant, Intramuros (Ryomaandres,
CC BY-SA 4.0). Es un panorama real de teléfono, no un recorte del 360.
También solo se achica. El vertical estimado es 58°, y el horizontal
sale del aspecto (cerca de 257°). La etiqueta cae sobre una mesa. No es
una zona nueva del plano.
