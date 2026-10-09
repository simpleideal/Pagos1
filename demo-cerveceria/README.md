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

La pestaña «Recorrido y reserva» junta el tour, los puntos de las
mesas y el contacto. La reserva sale por WhatsApp.

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

Columnas del CSV, en este orden:

`mesa`, `zona`, `capacidad`, `estado`, `yaw`, `pitch`, `nota`

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
(`.mesa-punto.libre`). Reservada se pinta gris
(`.mesa-punto.reservada`). En la muestra, la 4 y la 8 están
reservadas.

Tocar un punto llama `window.brumaAbrirMesa`. El botón «Reservar
mesa» abre el mismo cuadro, con un selector. Si la mesa está libre,
el enlace es WhatsApp al número `CONTACTO.whatsappReservas`, con el
texto de la reserva. Si está reservada, el cuadro muestra «Reservada»
y no arma el mensaje. No cambies ese cuadro ni los colores al tocar
los datos.

### Conectar la hoja de Google

1. En Drive: **Nuevo → Hojas de cálculo**.
2. Fila 1 con las columnas de arriba, en ese orden.
3. Desde la fila 2, una mesa por fila. `zona`: `barra`, `mesas` o
   `terraza`. `estado`: `libre` o `reservada`. `yaw` y `pitch`:
   grados, con punto o coma decimal.
4. **Archivo → Compartir → Publicar en la web**. Pestaña de las
   mesas → **Valores separados por comas (.csv)** → **Publicar**.
   Copia el enlace.
5. En `demo-cerveceria/index.html`, busca **PEGA LA URL** y pega
   ese enlace en `FUENTE.mesas`.

Si la URL queda vacía o la hoja falla, siguen las 8 mesas de
`datos/mesas.csv`.

### Desde el teléfono del dueño

1. Abre la hoja de las mesas.
2. Busca la fila de la mesa.
3. En `estado`, escribe `reservada`. Para dejarla libre, escribe
   `libre`.
4. No hace falta volver a publicar. Al recargar la página se lee
   el CSV de nuevo (`cache: no-store`).

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
