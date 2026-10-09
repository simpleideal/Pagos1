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
La misma fachada oscurecida queda fija detrás de toda la página
(`position: fixed` sobre `img/fachada.jpg`, sin `background-attachment`).
Carta y Recorrido y reserva van en cuadros negros semitransparentes,
con un desenfoque leve, como el horario de la portada. El ámbar es solo
el precio. Las cervezas se separan con una línea. Lo agotado se ve en gris
y con el precio tachado.

La pestaña «Recorrido y reserva» junta el tour, el plano y el contacto.
«Reservar mesa» abre el mismo cuadrito que una mesa libre del plano o del 360.

# Recorrido y plano

La sección `#tour-360` usa fotos de ejemplo, no del local.
Las tres zonas del plano (barra, mesas, terraza) tienen panorama 360×180.
`mesas-pano` es la panorámica de teléfono de la misma zona Mesas, no un cuarto nuevo.

Las fotos grandes están en `img/360/`. En pantallas de hasta 720px la página
pide `*-movil.jpg` y solo descarga la escena que se está mirando.

## Cambiar una foto 360 o panorámica

Foto 360 completa (equirectangular):

1. Guarda el archivo en `img/360/nombre.jpg` y una versión liviana en
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

`yaw` y `pitch` marcan la etiqueta de la zona y también la vista inicial.

Una foto del teléfono no cubre 360×180. No hay que estirarla.

1. Guarda `img/360/nombre.jpg` y `nombre-movil.jpg` igual que arriba.
2. Estima el ángulo vertical, `vertical` (vaov). En el teléfono suele estar
   entre 50° y 70°.
3. No escribas el ángulo horizontal. La página lo calcula y no lo deja
   pasar de 360:

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

`desfase` es el vOffset de Pannellum: 0 deja el horizonte en el centro.
Un valor negativo baja ese centro.

Si `haov` sale menor que 360, el visor se detiene en los bordes:
`minYaw`/`maxYaw` en ±haov/2 y `minPitch`/`maxPitch` en
`desfase ± vertical/2`. Si el producto pasa de 360, queda en 360.

## Yaw y pitch de una mesa

Cada mesa tiene `yaw` y `pitch` en grados: el punto de la foto al que
mira el visor cuando se toca en el plano.

Para leerlos, en `configVisor` agrega por un momento `hotSpotDebug: true`
dentro de `default`. Recarga, abre la escena y haz clic en la mesa de la
foto. Pannellum escribe en la esquina el yaw y el pitch de ese clic.
Copia esos números a la mesa y quita `hotSpotDebug`. No lo dejes puesto:
el visor de la muestra no lo trae activado.

## Cómo funciona el plano

El plano lee `window.BRUMA_MESAS`. Si el arreglo ya está, lo usa; si no,
espera el evento `bruma:mesas`. `js/mesas-ejemplo.js` solo llena datos de
muestra cuando todavía no hay otros. No hace falta un CSV en esta página.

Cada mesa se dibuja con su número y su capacidad. Verde si está libre.
Gris si `estado` no es `libre`, o si viene `ocupada_ahora` marcado
(cualquier valor distinto de `0`, `false`, `no` o `libre`). Si
`ocupada_ahora` no viene, manda el estado.

La posición es `plano_x` y `plano_y`, en porcentaje de 0 a 100.
`forma` puede ser `redonda`, `cuadrada` o `alargada` (también `circulo`,
`square`, `rectangular`). Si no vienen la posición o la forma, la página
reparte las mesas dentro del rectángulo de su zona y elige la forma por
la capacidad: hasta 2 redonda, hasta 4 cuadrada, y el resto alargada.
Una zona `mesas` se ve en el 360 y en `mesas-pano`.

Tocar una mesa cambia el visor a su escena y gira hasta su yaw y pitch.
Si está libre, abre el mismo cuadrito de reserva. Los botones 2, 4 y 6+
dejan encendidas solo las mesas donde caben esas personas (6+ es seis o
más). Tocarlo de nuevo quita el filtro. Si existe
`window.BRUMA_MESAS_LIBRE_A`, aparece un selector de hora:

- con dos argumentos, `funcion(mesa, hora)` y un sí o no;
- con uno, `funcion(hora)` y una lista de mesas (número u objeto con
  `mesa`) o un mapa por número de mesa.

Si esa función falla o no contesta, la mesa no se apaga.

El cono azul, en la zona que se está mirando, gira con `getYaw` del visor.
Tocar Terraza, Mesas o Barra muestra una frase corta. En Barra se destaca
el happy hour de lunes a jueves, 18:00–20:00.

«Hoy quedan X de N mesas libres» sale en el plano y, en chico, en el
horario del inicio. Cuenta las que no están reservadas ni ocupadas ahora.

## Créditos y licencias

- Fachada de la portada, `img/fachada.jpg`: Sixty Four, Bacoor — foto de
  UndueMarmot, [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.es).
  2000×1500. No es el local.
- Barra, `img/360/barra.jpg`: [Bier macht Schön, Colonia](https://commons.wikimedia.org/wiki/File:Bier_macht_Sch%C3%B6n_%E2%80%93_Crafbeer_Shop_in_K%C3%B6ln_2019.jpg)
  — foto de Maximilian Schönherr, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
  Panorama completo. Solo se achicó: no se recortó.
- Mesas 360, `img/360/mesas.jpg`: Poly Haven, `warm_restaurant_night` —
  Greg Zaal y Jarod Guest, [CC0](https://polyhaven.com/a/warm_restaurant_night).
- Terraza, `img/360/terraza.jpg`: Poly Haven, `sundowner_deck` —
  Dario Barresi, [CC0](https://polyhaven.com/a/sundowner_deck).
- Panorámica de las mesas, `img/360/mesas-pano.jpg`: [Barbara's Heritage Restaurant, Intramuros](https://commons.wikimedia.org/wiki/File:Barbara%27s_Heritage_Restaurant_Intramuros_Interior_Panorama.jpg)
  — foto de Ryomaandres, [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
  Es otra foto, no un recorte del 360. Vertical estimado 58°; el horizontal
  sale del aspecto, cerca de 257°. La etiqueta cae sobre una mesa.

## Peso para el teléfono

La versión `*-movil.jpg` conviene dejarla bajo unos 400 KB, con el lado
largo cerca de 2000 px. Así entra bien en un teléfono de gama media.
En esta muestra, aproximado:

| Archivo | Peso |
| --- | --- |
| `barra-movil.jpg` | 257 KB |
| `mesas-movil.jpg` | 337 KB |
| `mesas-pano-movil.jpg` | 134 KB |
| `terraza-movil.jpg` | 407 KB |

`terraza-movil.jpg` es el más pesado. Las fotos de escritorio (`barra.jpg`
898 KB, `mesas.jpg` 1,4 MB, `mesas-pano.jpg` 717 KB, `terraza.jpg` 1,5 MB)
no se piden en pantallas de hasta 720 px.
