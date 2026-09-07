# Muestra del llavero NFC

Página de cobro de una sola pantalla, igual a la que va grabada en los
llaveros. El teléfono se acerca al chip, se abre el enlace y los datos de
transferencia quedan listos para copiar y pegar en la app del banco.

**Este repositorio es la muestra pública.** Los datos de Casa Bruma son
inventados: no pertenecen a ninguna persona ni negocio real. Sirve para
ofrecer el producto, grabar el video y probar integraciones nuevas sin
exponer clientes.

La página publicada está en
[simpleideal.github.io/Pagos1](https://simpleideal.github.io/Pagos1/).

## Qué no hay que hacer con las ramas de los clientes

Los llaveros de **CH Moda Reciclada** y **La Nico** viven en sus propios
repositorios. Ahí se abrieron ramas para logos de bancos, redes sociales,
WhatsApp y el tema claro.

Esas ramas **no se traen a este repo**. Mezclarlas copiaría datos reales
(nombres, RUT, cuentas, teléfonos, Instagram) a una página que se va a
mostrar y a grabar.

Lo que sí se trae es la **interfaz ya fusionada** en esos `main`:

- pestañas por banco, con logos oficiales
- copiar todo / dato por dato
- WhatsApp y guardar contacto
- Instagram y Facebook en el pie

Los valores se cambian solo en el bloque `DATOS DEL CLIENTE` de
`index.html`. Debajo de `FIN DE LOS DATOS DEL CLIENTE` no hace falta
tocar nada para armar una muestra o un llavero nuevo.

Si más adelante CH Moda o La Nico ganan otra función, el camino es el
mismo: copiar el código de la interfaz, no la rama, y dejar a Casa Bruma
con datos inventados.

La plantilla canónica para clientes nuevos sigue siendo
[simpleideal/cobro](https://github.com/simpleideal/cobro). Este repo
queda como sandbox y vitrina.

## Los tres bloques

Están cerca del inicio del `<script>`:

```js
/* ==================================================================
   DATOS DEL CLIENTE
   ...
   ================================================================== */
```

| Bloque | Qué guarda |
| --- | --- |
| `CLIENTE` | Título, empresa, razón social, nombre corto, RUT, fondo y acento |
| `CONTACTO` | Quien recibe el comprobante, WhatsApp, vCard y redes |
| `CUENTAS` | Una entrada por banco, en el orden de las pestañas |

Con una sola cuenta la barra de pestañas no se muestra.

```js
const CUENTAS = [
    {
        banco: 'santander',
        tipoCuenta: 'Cuenta Corriente',
        cuenta: '74829105'
    },
    {
        banco: 'bancoEstado',
        tipoCuenta: 'Cuenta Pro',
        cuenta: '12458973610'
    }
];
```

`banco` es una clave del catálogo `BANCOS`, no el nombre escrito. `correo`
es opcional: si no está, se usa el de `CONTACTO`.

## Publicar

En **Settings → Pages**, rama `main` y carpeta raíz. Los cambios tardan un
par de minutos. Si la página se ve vieja, recargar con Ctrl+Shift+R.

## Antes de usarla en un video o una reunión

- Abrirla en un teléfono, no solo en el computador.
- Cambiar de pestaña (Santander / BancoEstado) y recorrer copiar todo y
  dato por dato.
- Dejar visible el aviso **Muestra · datos inventados**.
- No reemplazar Casa Bruma por un cliente real en este repo.
