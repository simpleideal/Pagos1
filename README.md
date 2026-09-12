# Muestras de llavero NFC

Repositorio para mostrar la interfaz de los llaveros y para probar
integraciones. **Todos los datos de estas páginas son inventados.**

Hay tres muestras. Cada una es un tipo de página distinto. No se
mezclan: si una página pide datos de cuenta o del auto, va en la 1.
Si muestra trabajo o un proyecto, va en la 2. Si vende un menú u
otro producto a la carta, va en la 3.

## Muestra 1 · Datos del cliente

Páginas que **registran datos del cliente** para usarlos al momento.

Hoy eso es cobro: nombre, RUT, banco, tipo de cuenta, número de
cuenta y correo, para copiar y pegar en la app del banco. En el
subtipo Uber también van los datos del **vehículo** (3D, fotos,
patente, papeles) y la transferencia se abre en una hoja.

- **Convencional:** Boutique (Luna Atelier) — `demo-boutique/`
- **Uber:** conductor (Diego Morales) — `demo-conductor/`

La plantilla de cobro para un cliente real vive en
[`simpleideal/cobro`](https://github.com/simpleideal/cobro). Ahí está
documentada la idea práctica: el aviso de voucher lo lee quien paga,
en la página; el WhatsApp le avisa a quien cobra que le van a
transferir. Las muestras de cobro de este repo siguen esa separación.

`demo-segunda/` y `demo-taller/` son otras pieles de cobro. Siguen en
el repo, pero ya no están en el índice.

## Muestra 2 · Trabajo y proyectos

Páginas de **información laboral**: se muestra el oficio y se exponen
servicios o proyectos ya hechos.

Hoy es el portafolio de construcción (Obras Rivera): obras por zona,
foto, lugar, año y metros. Sirve para empresas que se presentan con
trabajos anteriores, no para cobrar ni para vender un menú.

- **Portafolio:** Obras Rivera — `demo-portafolio/`

## Muestra 3 · Carta: productos y servicios

Páginas de **carta**, como en un restorán: se ofrecen productos o
servicios para elegir. No van datos de transferencia ni de vehículos;
eso es muestra 1. Las dos de abajo son **independientes**: no se
fusionan entre sí.

- **Casa Fogón:** la carta que ya existía — `demo-carta/`
- **Buen Bocado:** otra página, con inicio, menú y contacto
  (pinta de restorán con foto grande) — `demo-restaurante/`

## Abrir las muestras

- [Índice](https://simpleideal.github.io/Pagos1/)
- [1 · Cobro, convencional](https://simpleideal.github.io/Pagos1/demo-boutique/)
- [1 · Cobro, Uber](https://simpleideal.github.io/Pagos1/demo-conductor/)
- [2 · Portafolio](https://simpleideal.github.io/Pagos1/demo-portafolio/)
- [3 · Carta Fogón](https://simpleideal.github.io/Pagos1/demo-carta/)
- [3 · Restorán Buen Bocado](https://simpleideal.github.io/Pagos1/demo-restaurante/)

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

## Cómo se cambia

Muestra 1, boutique: en `demo-boutique/index.html`, el bloque de datos
del cliente.

Muestra 1, conductor: en `demo-conductor/index.html`, el bloque
**DATOS DEL CONDUCTOR**. El modelo 3D es
`demo-conductor/modelos/auto.glb` (solo el auto). Las fotos del dueño
se cambian en `fotos`. El PDF de muestra está en
`demo-conductor/documentos/permiso-muestra.pdf` (clave `1234`).

Muestra 2, portafolio: en `demo-portafolio/index.html`, el bloque
**DATOS DEL PORTAFOLIO**.

Muestra 3, Fogón: en `demo-carta/index.html`, el bloque
**DATOS DE LA CARTA**. Cada plato puede llevar varias `fotos`; si hay
más de una, rotan cada 4 segundos.

Muestra 3, Buen Bocado: en `demo-restaurante/index.html`. Es otra
página, independiente de Fogón. En **Contáctanos** el mapa es de
Google Maps, para encontrarlo y abrir la app de mapas del teléfono.
