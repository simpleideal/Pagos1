# Reservas y «Llamar al mesero» con Apps Script

`Code.gs` recibe los pedidos de reserva de la página y los anota en la
pestaña **reservas** de la hoja «bar la bruma». También recibe los
toques del botón **Llamar al mesero** y los anota en la pestaña
**llamados**. Cada pedido entra como
`pendiente`. El script **nunca** marca una mesa como ocupada: eso lo
decides tú.

Las pestañas **reservas** y **llamados** no se publican nunca en la
web. `reservas` tiene nombres y teléfonos de clientes.

## Instalarlo (desde el computador, una sola vez)

1. Abre la hoja **bar la bruma** en Chrome.
2. Menú **Extensiones → Apps Script**. Se abre una pestaña nueva.
3. Borra lo que aparece en `Código.gs` y pega todo el contenido de
   [`Code.gs`](Code.gs).
4. Toca el ícono del disquete (**Guardar**).
5. Arriba a la derecha: **Implementar → Nueva implementación**.
6. En la rueda junto a «Seleccionar tipo», elige **App web**.
7. Completa:
   - Descripción: `Reservas Bruma`
   - **Ejecutar como: Yo** (tu cuenta)
   - **Quién tiene acceso: Cualquier persona**
8. Toca **Implementar**.
9. Toca **Autorizar acceso** y elige tu cuenta de Google.
10. Aparece «**Google no verificó esta app**». Es normal, porque el
    script es tuyo. Toca **Configuración avanzada** y luego
    **Ir a Reservas Bruma (no seguro)** (o el nombre de tu proyecto).
11. Revisa los permisos (ver y editar tus hojas) y toca **Permitir**.
12. Copia la **URL de la app web**. Termina en `/exec`.
13. Pégala en el grupo «Gran Proyecto» para que la conecten a la página.

Para probarla, abre esa URL en el navegador. Debe decir `{"ok":true}`.

### Clave de la barra (CLAVE_BARRA)

La pantalla de la barra necesita una clave para ver los llamados y
marcarlos como atendidos. Sin ella, nadie de afuera puede verlos.

1. En Apps Script, toca la rueda **Configuración del proyecto** (a la
   izquierda).
2. Baja a **Propiedades del script → Agregar propiedad del script**.
3. Propiedad: `CLAVE_BARRA`. Valor: una clave que inventes (por
   ejemplo, 10 letras y números). **Guardar propiedades del script**.
4. Esa clave se escribe solo en la pantalla de la barra. No la pegues
   en el grupo ni en la página pública.

Para cambiarla, edita el valor ahí mismo. No hace falta implementar de
nuevo.

## Confirmar una reserva (dueño)

1. Abre la pestaña **reservas**. Cada fila es un pedido.
2. Escribe por WhatsApp al `telefono` si necesitas confirmar.
3. En `estado`, elige de la lista **confirmada** o **rechazada**.
4. Si la confirmas, ve a la pestaña **mesas**, busca la mesa y anota
   `reservada_desde`, `reservada_hasta` y `fecha` (o pon `estado` en
   `reservada`). Así la página la muestra ocupada.
5. En `nota` puedes dejar un comentario tuyo.

Un mismo teléfono no puede tener más de 3 pedidos `pendiente` a la vez.
Al confirmar o rechazar se libera el cupo.

## Llamar al mesero (barra)

- El cliente toca **Llamar al mesero** y aparece una fila `pendiente`
  con la mesa y la hora.
- Si la misma mesa vuelve a tocar antes de 2 minutos, no se crea otra
  fila: se usa la misma.
- En la pantalla de la barra, al tocar **Listo** el llamado pasa a
  `listo` y se anota la hora en `atendida`. También puedes cambiar
  `estado` a `listo` a mano en la pestaña **llamados**.

## Actualizar el script

Si cambia `Code.gs` en el repositorio:

1. **Extensiones → Apps Script**, reemplaza el código y **Guardar**.
2. **Implementar → Administrar implementaciones**.
3. Toca el lápiz (**Editar**) de «Reservas Bruma».
4. En **Versión**, elige **Nueva versión** y toca **Implementar**.

Así la URL `/exec` sigue siendo la misma. Si en cambio haces una
«Nueva implementación», sale una URL distinta y hay que avisarla.

## Para quien programa la página

- `GET /exec` → `{"ok":true}` (prueba de salud).
- `POST /exec` con JSON o campos de formulario: `mesa`, `fecha`
  (`AAAA-MM-DD`, no pasada), `hora` (`HH:MM`), `personas` (1 a 20),
  `nombre`, `telefono` (8 a 15 dígitos, `+` opcional) y `website`
  (trampa oculta: debe ir vacía).
  Sin `accion`, o con `accion: 'reservar'`, es una reserva.
- Respuesta: `{"ok":true}` o `{"ok":false,"error":"..."}`. Errores:
  `faltan_datos`, `mesa_invalida`, `fecha_invalida`, `fecha_pasada`,
  `hora_invalida`, `personas_invalidas`, `nombre_invalido`,
  `telefono_invalido`, `demasiadas_pendientes`, `rechazada`,
  `ocupado_reintenta`, `datos_ilegibles`, `error_interno`.
- `POST {accion:'llamar', mesa, website}` → `{"ok":true,"id":"..."}`.
  Si la mesa ya tiene un llamado `pendiente` de los últimos 2 minutos,
  devuelve ese mismo `id`.
- `GET ?accion=llamado&id=ID` → `{"ok":true,"estado":"pendiente"|"listo"}`
  (para que el cliente consulte cada tanto).
- `GET ?accion=llamados&clave=K` → `{"ok":true,"llamados":[{"id","mesa","hora","estado"}]}`
  con los pendientes; `hora` es `HH:mm` de `creada`.
- `POST {accion:'listo', id, clave}` → `{"ok":true}`.
- Errores extra: `clave_invalida` (falta `CLAVE_BARRA` o no coincide),
  `no_existe`, `accion_invalida`.
- **CORS:** envía con `Content-Type: text/plain;charset=utf-8` y el
  JSON en el cuerpo. Con `application/json` el navegador hace una
  petición previa que Apps Script no contesta.

```js
fetch(URL_EXEC, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({ mesa, fecha, hora, personas, nombre, telefono, website: '' })
}).then(r => r.json());
```
