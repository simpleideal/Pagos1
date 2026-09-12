# Muestras de llavero NFC

Repositorio para mostrar la interfaz de los llaveros y para probar
integraciones. **Todos los datos de estas páginas son inventados.**

Tres muestras en el índice, tres usos distintos:

1. **Cobro** — copiar datos de transferencia. Dos subtipos:
   - **Convencional:** Boutique (Luna Atelier).
   - **Uber:** conductor (Diego Morales). Primero se ve el auto en 3D,
     las fotos del dueño y la patente; los documentos van arriba; la
     transferencia se abre en una hoja, como los bebestibles de la
     carta. PDF de fiscalización con clave `1234`.
2. **Obras Rivera** — portafolio de trabajos hechos. Las fotos se abren
   con [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe).
3. **Casa Fogón** — restorán, tres subtipos:
   - **Carta:** la muestra que ya existía (`demo-carta/`). Foto, precio
     y tiempo por plato. PhotoSwipe y hoja de bebestibles.
   - **Página:** otra pinta de Fogón (`demo-fogon-pagina/`), con inicio,
     carta y contacto. No reemplaza la carta de arriba.
   - **Cobro:** copia de la plantilla [`simpleideal/cobro`](https://github.com/simpleideal/cobro)
     en `demo-fogon-cobro/`, con datos inventados.

`demo-segunda/` y `demo-taller/` siguen en el repo (otras pieles de cobro)
pero ya no son muestras del índice.

La plantilla de cobro para un cliente real vive en
[`simpleideal/cobro`](https://github.com/simpleideal/cobro). Ahí está
documentada la idea práctica de los llaveros NFC (incluido Uber más
adelante): el aviso de voucher lo lee quien paga, en la página; el
WhatsApp le avisa a quien cobra que le van a transferir. Las muestras
de cobro de este repo siguen esa separación. No aplica a Obras Rivera
(cotización) ni a la carta de Casa Fogón (reserva). El cobro de Fogón
sí la sigue.

## Abrir las muestras

- [Índice](https://simpleideal.github.io/Pagos1/)
- [1 · Cobro, convencional](https://simpleideal.github.io/Pagos1/demo-boutique/)
- [1 · Cobro, Uber](https://simpleideal.github.io/Pagos1/demo-conductor/)
- [2 · Portafolio](https://simpleideal.github.io/Pagos1/demo-portafolio/)
- [3 · Carta](https://simpleideal.github.io/Pagos1/demo-carta/)
- [3 · Página restorán](https://simpleideal.github.io/Pagos1/demo-fogon-pagina/)
- [3 · Cobro, restorán](https://simpleideal.github.io/Pagos1/demo-fogon-cobro/)

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

## Cómo se cambia

Portafolio: en `demo-portafolio/index.html`, el bloque **DATOS DEL PORTAFOLIO**.

Carta: en `demo-carta/index.html`, el bloque **DATOS DE LA CARTA**.
Cada plato puede llevar varias `fotos`; si hay más de una, rotan
cada 4 segundos.

Página del restorán: en `demo-fogon-pagina/index.html`. Es otra pinta
de Fogón; no reemplaza `demo-carta/`.

Cobro del restorán: en `demo-fogon-cobro/index.html`, el bloque
**DATOS DEL CLIENTE**. Es la plantilla cobro; debajo de
`FIN DE LOS DATOS DEL CLIENTE` no hay que tocar nada.

Conductor (subtipo Uber del cobro): en `demo-conductor/index.html`,
el bloque **DATOS DEL CONDUCTOR**. El modelo 3D es
`demo-conductor/modelos/auto.glb` (solo el auto). Las fotos del dueño
se cambian en `fotos`. El PDF de muestra está en
`demo-conductor/documentos/permiso-muestra.pdf` (clave `1234`).
