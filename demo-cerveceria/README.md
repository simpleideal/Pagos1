# Cervecería Bruma

La página tiene tres pestañas: Inicio, Carta y Reserva.
En el encabezado van a la derecha, en la misma fila que «Bruma +18»,
en el teléfono y en el escritorio. No hay menú de hamburguesa.
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
Carta y Reserva van en cuadros negros semitransparentes,
con un desenfoque leve, como el horario de la portada. El ámbar es solo
el precio. Las cervezas se separan con una línea. Lo agotado se ve en gris
y con el precio tachado.

La pestaña «Reserva» junta el tour, el plano y el contacto.
El título de esa sección también dice «Reserva».
«Reservar mesa» abre el mismo cuadrito que una mesa libre del plano o del 360.
Pide nombre y teléfono, y la reserva sale por WhatsApp.
Si `RESERVAS_URL` tiene la dirección `/exec`, también se anota en la hoja.

# Recorrido y plano

«Mover con el teléfono» está dentro del marco de la foto. Solo se muestra
si el aparato puede usar la orientación, y no sale a la portada: el marco
recorta lo que queda afuera (`overflow: hidden`).

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
espera el evento `bruma:mesas`. Los datos los publica `js/mesas.js`
desde `FUENTE.mesas` o, si no hay hoja, desde `datos/mesas.csv`.
El detalle de columnas y de la hoja está más abajo, en «Mesas para reservar».

Cada mesa se dibuja con su número y su capacidad. Verde si está libre.
Gris si `estado` no es `libre`, o si viene `ocupada_ahora` marcado
(cualquier valor distinto de `0`, `false`, `no` o `libre`). Si
`ocupada_ahora` no viene, manda el estado.

La posición es `plano_x` y `plano_y`, en porcentaje de 0 a 100.
`forma` puede ser `redonda`, `cuadrada`, `alargada` o `barra` (también
`circulo`, `square`, `rectangular`). Si no vienen la posición o la forma,
la página reparte las mesas dentro del rectángulo de su zona y elige la
forma por la capacidad: hasta 2 redonda, hasta 4 cuadrada, y el resto
alargada.
Una zona `mesas` se ve en el 360 y en `mesas-pano`.

Tocar una mesa cambia el visor a su escena y gira hasta su yaw y pitch.
Si está libre, abre el mismo cuadrito de reserva. Los botones 2, 4 y 6+
dejan encendidas solo las mesas donde caben esas personas (6+ es seis o
más). Tocarlo de nuevo quita el filtro. Si existe
`window.BRUMA_MESAS_LIBRE_A`, aparece un selector de hora.
`js/mesas.js` la define como `BRUMA_MESAS_LIBRE_A(hora, fecha)` y
devuelve cada mesa con `libre` y `ocupada`. El plano también acepta
otras respuestas, por si la función cambia de forma:

- `funcion(mesa, hora)` con un sí o no;
- `funcion(hora)` con una lista de mesas (número, u objeto con `mesa`
  y, si viene, `libre` u `ocupada`) o un mapa por número de mesa.

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

## Mesas para reservar

Hay una sola fuente de mesas: `js/mesas.js`. No agregues otro archivo
de ejemplo ni otra etiqueta `<script>` que vuelva a llenar el arreglo.

### Cómo llegan los datos

1. `datos/mesas.csv` trae 8 mesas de muestra.
2. En `index.html`, `FUENTE.mesas` queda `''`. Ahí se pega la URL
   publicada, en el comentario que dice **PEGA LA URL**, igual que
   la carta.
3. `js/mesas.js` se carga al final de `index.html`, después del
   script que define `FUENTE`. Así ve la URL.
4. Si `FUENTE.mesas` está vacía, la hoja no responde o no deja filas
   válidas, usa `datos/mesas.csv`.
5. Publica el arreglo en `window.BRUMA_MESAS` y dispara el evento
   `bruma:mesas`. El arreglo va en `detail`.

Cada objeto queda con tipos limpios:

| Campo | Tipo | Valores |
| --- | --- | --- |
| `mesa` | texto | el número o nombre, por ejemplo `4` |
| `zona` | texto | `barra`, `mesas` o `terraza` |
| `capacidad` | número | personas |
| `estado` | texto | `libre` o `reservada` |
| `yaw` | número o `null` | grados de Pannellum |
| `pitch` | número o `null` | grados de Pannellum |
| `nota` | texto | puede ir vacía |
| `plano_x` | número o `null` | 0 a 100, centro en el plano |
| `plano_y` | número o `null` | 0 a 100, centro en el plano |
| `forma` | texto o `null` | `redonda`, `cuadrada` o `barra` |
| `reservada_desde` | número o `null` | minutos desde medianoche |
| `reservada_hasta` | número o `null` | minutos desde medianoche |
| `fecha` | texto o `null` | `AAAA-MM-DD` |
| `ocupada_ahora` | booleano | se calcula, no va en el CSV |

En el CSV, `reservada_desde` y `reservada_hasta` se escriben `HH:MM`.
En el objeto quedan en minutos (`21:00` → `1260`). Si faltan las
columnas nuevas, quedan en `null` y manda `estado`, como antes.

Columnas del CSV, en este orden:

`mesa`, `zona`, `capacidad`, `estado`, `yaw`, `pitch`, `nota`,
`plano_x`, `plano_y`, `forma`, `reservada_desde`, `reservada_hasta`,
`fecha`

`yaw` y `pitch` de la muestra están aproximados, cerca de la vista
inicial de cada escena y fuera de la etiqueta del lugar (barra en
yaw 0 / pitch −18, mesas en −30 / −12, terraza en −27 / −18).

### Cómo los usan los puntos

El visor de `#tour-360` (el del PR de los puntos) no lee el CSV.
Al arrancar llama `tomarMesas()`, por si `window.BRUMA_MESAS` ya
está, y además escucha `bruma:mesas`. El cuadro de reserva hace lo
mismo con `llenarCual()`.

Una fila con `zona` `mesas` se dibuja en la escena `mesas` y también
en `mesas-pano` (la panorámica de teléfono). `mesas-pano` no es una
zona del CSV. `barra` y `terraza` solo salen en su escena.

El punto usa el `yaw` y el `pitch` de la fila. Libre se pinta verde
(`.mesa-punto.libre`). Reservada u ocupada ahora se pinta gris
(`.mesa-punto.reservada`). El mismo criterio pinta la mesa en el
plano. En la muestra, la 4 está reservada por estado y sale gris.
La 8 está libre en `estado` y ocupada solo de 21:00 a 23:30: fuera
de ese tramo sale verde, y dentro sale gris.

`plano_x` y `plano_y` son el centro de la mesa en el dibujo de
muestra (`viewBox` 0 0 280 360), en porcentaje del ancho y del alto.
El plano interactivo pone cada mesa en ese centro. Los centros que
ya dibuja el SVG:

- 7 y 8, terraza: círculos en 33,6% / 13,9% y 66,4% / 13,9%
- 3, 5, 4 y 6, salón: los cuatro rectángulos, de izquierda a
  derecha y de arriba a abajo, en 26,8% / 35,6%, 73,2% / 35,6%,
  26,8% / 50,6% y 73,2% / 50,6%
- 1 y 2, barra: taburetes de los extremos, 26,4% / 75,6% y 75% / 75,6%

Cada minuto se vuelve a calcular `ocupada_ahora` con la hora de
Chile (`America/Santiago`). Si alguna mesa cambia, se dispara otra
vez `bruma:mesas`.

`window.BRUMA_MESAS_LIBRE_A('22:00')` devuelve, para cada mesa,
`libre` y `ocupada` a esa hora. El segundo argumento es una fecha
`AAAA-MM-DD`. Si no se pasa, usa el día de hoy en Chile. La 8 sale
ocupada a las 22:00 y libre a las 15:00. La 4 sale ocupada a
cualquier hora.

Tocar un punto llama `window.brumaAbrirMesa`. El botón «Reservar
mesa» abre el mismo cuadro, con un selector. Si la mesa está libre,
pide el día, la hora, las personas, el nombre y un teléfono de Chile
(puede empezar con `+56`). «Reservar por WhatsApp» abre
`CONTACTO.whatsappReservas` con ese texto, y el mensaje suma el
nombre. Si está reservada, el cuadro muestra «Reservada»
y no arma el mensaje. No cambies ese cuadro ni los colores al tocar
los datos.

### Anotar la reserva en la hoja

En `index.html`, junto a `CONTACTO`, está `RESERVAS_URL`. Ahí va la
dirección `/exec` del Google Apps Script: la URL que termina en
`/exec` después de Implementar → Aplicación web.

Si queda `''`, el cuadrito solo abre WhatsApp.

Si tiene la dirección, al tocar «Reservar por WhatsApp» la página
hace un `POST` con `Content-Type: text/plain;charset=utf-8` y este
JSON: `mesa`, `fecha` (`AAAA-MM-DD`), `hora` (`HH:MM`), `personas`,
`nombre`, `telefono`, `website`.

`website` es una trampa para robots. El campo está fuera de la
pantalla y no entra en el tabulador. Nombre y teléfono son
obligatorios.

Si la respuesta es `{ok:true}`, se lee «Reserva enviada, el local
te confirma por WhatsApp». Si es `{ok:false,error}`, se muestra
ese error con calma. Si el envío falla, también se avisa. En todos
esos casos se abre igual el WhatsApp.

### Conectar la hoja de Google

1. En Drive: **Nuevo → Hojas de cálculo**.
2. Fila 1 con las columnas de arriba, en ese orden.
3. Desde la fila 2, una mesa por fila. `zona`: `barra`, `mesas` o
   `terraza`. `estado`: `libre` o `reservada`. `yaw` y `pitch`:
   grados, con punto o coma decimal. Las columnas del plano y del
   horario pueden ir vacías.
4. **Archivo → Compartir → Publicar en la web**. Pestaña de las
   mesas → **Valores separados por comas (.csv)** → **Publicar**.
   Copia el enlace.
5. En `demo-cerveceria/index.html`, busca **PEGA LA URL** y pega
   ese enlace en `FUENTE.mesas`.

Si la URL queda vacía o la hoja falla, siguen las 8 mesas de
`datos/mesas.csv`.

### Desde el teléfono del dueño

Para dejarla reservada todo el día:

1. Abre la hoja de las mesas.
2. Busca la fila de la mesa.
3. En `estado`, escribe `reservada`. Deja vacías
   `reservada_desde`, `reservada_hasta` y `fecha`.
4. Para dejarla libre, escribe `libre` y vacía esas tres celdas.

Para una reserva por horario, deja `estado` en `libre` y anota el
tramo. La mesa cuenta como reservada solo dentro de esas horas. Si
el tramo cruza la medianoche, la hora de fin es menor que la de
inicio (`22:00` y `01:00` reserva hasta la una).

Ejemplo, la mesa 8 de la muestra, todos los días de 21:00 a 23:30:

```text
estado: libre
reservada_desde: 21:00
reservada_hasta: 23:30
fecha: (vacía)
```

Si la reserva es de un solo día, escribe la fecha `AAAA-MM-DD`.
Ese día manda el horario. Los otros días manda `estado`.

```text
estado: libre
reservada_desde: 21:00
reservada_hasta: 23:30
fecha: 2026-10-09
```

No hace falta volver a publicar. Al recargar la página se lee el
CSV de nuevo (`cache: no-store`).

## Carta y happy hour

La carta y el happy hour no pasan por `js/mesas.js`. Los lee el
script de `index.html`.

### Carta

`FUENTE.carta` queda `''`. Si está vacía o la hoja no responde, se
usa `datos/carta.csv`.

Columnas: `nombre`, `estilo`, `abv`, `ibu` (opcional), `formato`
(`schop`, `botella` o `lata`), `precio`, `precio_oferta` (opcional),
`disponible` (`si` o `no`), `destacada` (`si` o `no`), `foto`
(URL opcional), `descripcion`.

La primera fila con `destacada` en `si` es la oferta del día.
También vale una columna `oferta`. Al entrar se ven la oferta y
cuatro cervezas. El resto se abre con «Ver carta completa».

Para conectar la hoja: publícala como CSV, igual que las mesas, y
pega la URL en `FUENTE.carta`.

### Happy hour

`FUENTE.happy` queda `''`. Si está vacía o la hoja no responde, se
usa `datos/happy-hour.csv`. Si ese archivo tampoco deja tramos, se
usan las constantes `HAPPY`: lunes a jueves, 18:00 a 20:00, zona
`America/Santiago`. El reloj es el del dispositivo.

Columnas: `dias`, `inicio`, `fin`, `zona`. La muestra trae
`lun-jue`, `18:00`, `20:00`, `America/Santiago`.

Para otra hoja, pega su CSV publicado en `FUENTE.happy`.

Para ver los dos estados sin esperar la hora: `?hh=ahora` y
`?hh=no`.
