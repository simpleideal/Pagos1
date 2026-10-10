# Apps Script de las reservas

Esto no es la página. Es el script para pegar en Google Apps Script
y anotar cada reserva en la hoja. La muestra de Bruma se ve igual.

El archivo es `Code.gs`. Va en la misma hoja de las mesas, en
**Extensiones → Apps Script**.

## Qué recibe

Un `POST` con `Content-Type: text/plain;charset=utf-8`. El cuerpo
es JSON:

| Campo | Qué es |
| --- | --- |
| `mesa` | número o nombre, por ejemplo `4` |
| `fecha` | `AAAA-MM-DD` |
| `hora` | `HH:MM` |
| `personas` | número, desde 1 |
| `nombre` | texto |
| `telefono` | texto |
| `website` | trampa para robots |

Si `website` trae algo, el script contesta `{ok:true}` y no escribe
la fila. El campo no se muestra en la página.

Si los datos sirven, agrega una fila en la pestaña `Reservas`.
Si esa pestaña no existe, la crea, con la primera fila en negrita:

`recibido`, `mesa`, `fecha`, `hora`, `personas`, `nombre`, `telefono`

`recibido` es la hora de Chile (`America/Santiago`), o la zona del
script si ya tiene otra.

La respuesta es `{ok:true}` o `{ok:false,error}`. El `error` es una
frase corta: falta la mesa, la fecha no es `AAAA-MM-DD`, la hora no
es `HH:MM`, faltan las personas, el nombre o el teléfono, no se pudo
leer el JSON, o no se pudo guardar.

No cambia las filas de las mesas. `estado`, `reservada_desde` y el
resto se siguen marcando a mano.

## Cómo pegarlo

1. Abre la hoja de las mesas.
2. **Extensiones → Apps Script**.
3. Borra el contenido de `Code.gs` y pega
   `demo-cerveceria/apps-script/Code.gs`.
4. Guarda el proyecto.
5. **Implementar → Nueva implementación → Aplicación web**.
6. Ejecutar como: tú. Quién tiene acceso: cualquier persona.
7. Autoriza el acceso a la hoja si Google lo pide.
8. Copia la URL. Termina en `/exec`.

Esa URL es la que va en `RESERVAS_URL` cuando la página la tenga,
junto a `CONTACTO` en `index.html`. Vacía, el cuadrito solo abre
WhatsApp. Esta carpeta no toca ese archivo.

Si cambias el script, haz una implementación nueva (o edita la
actual y crea una versión). Si no, la URL vieja sigue con el código
anterior.

Abrir `/exec` en el navegador no guarda nada: contesta que esa
dirección solo recibe reservas.
