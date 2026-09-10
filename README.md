# Muestras de llavero NFC

Repositorio para mostrar la interfaz de los llaveros y para probar
integraciones. **Todos los datos de estas páginas son inventados.**

Tres muestras en el índice, tres usos distintos:

1. **Cobro** — copiar datos de transferencia. Dos subtipos:
   - **Convencional:** Boutique (Luna Atelier).
   - **Uber:** conductor (Diego Morales). Primero se ve el auto y la
     patente; los documentos van arriba; la transferencia se abre en
     una hoja, como los bebestibles de la carta. PDF de fiscalización
     con clave `1234`.
2. **Obras Rivera** — portafolio de trabajos hechos. Las fotos se abren
   con [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe).
3. **Casa Fogón** — carta de restorán (foto, precio y tiempo por plato).
   Tocar la foto abre PhotoSwipe; el carrusel y la hoja de bebestibles
   siguen igual.

`demo-segunda/` y `demo-taller/` siguen en el repo (otras pieles de cobro)
pero ya no son muestras del índice.

La plantilla de cobro para un cliente real vive en
[`simpleideal/cobro`](https://github.com/simpleideal/cobro). Ahí está
documentada la idea práctica de los llaveros NFC (incluido Uber más
adelante): el aviso de voucher lo lee quien paga, en la página; el
WhatsApp le avisa a quien cobra que le van a transferir. Las muestras
de cobro de este repo siguen esa separación. No aplica a Obras Rivera
(cotización) ni a Casa Fogón (reserva).

## Abrir las muestras

- [Índice](https://simpleideal.github.io/Pagos1/)
- [1 · Cobro, convencional](https://simpleideal.github.io/Pagos1/demo-boutique/)
- [1 · Cobro, Uber](https://simpleideal.github.io/Pagos1/demo-conductor/)
- [2 · Portafolio](https://simpleideal.github.io/Pagos1/demo-portafolio/)
- [3 · Carta](https://simpleideal.github.io/Pagos1/demo-carta/)

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

## Cómo se cambia

Portafolio: en `demo-portafolio/index.html`, el bloque **DATOS DEL PORTAFOLIO**.

Carta: en `demo-carta/index.html`, el bloque **DATOS DE LA CARTA**.
Cada plato puede llevar varias `fotos`; si hay más de una, rotan
cada 4 segundos.

Conductor (subtipo Uber del cobro): en `demo-conductor/index.html`,
el bloque **DATOS DEL CONDUCTOR**. El PDF de muestra está en
`demo-conductor/documentos/permiso-muestra.pdf` (clave `1234`).
