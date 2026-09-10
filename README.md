# Muestras de llavero NFC

Repositorio para mostrar la interfaz de los llaveros y para probar
integraciones. **Todos los datos de estas páginas son inventados.**

Cuatro muestras en el índice, cuatro usos distintos:

1. **Boutique** — cobro (copiar datos de transferencia).
2. **Obras Rivera** — portafolio de trabajos hechos. Las fotos se abren
   con [PhotoSwipe](https://github.com/dimsemenov/PhotoSwipe).
3. **Casa Fogón** — carta de restorán (foto, precio y tiempo por plato).
   Tocar la foto abre PhotoSwipe; el carrusel y la hoja de bebestibles
   siguen igual.
4. **Diego Morales** — conductor (viaje). Transferencia, identificar el
   auto (patente, color, modelo y silueta 3D genérica) y un PDF de
   fiscalización con clave `1234`.

`demo-segunda/` y `demo-taller/` siguen en el repo (otras pieles de cobro)
pero ya no son muestras del índice.

La plantilla de cobro para un cliente real vive en
[`simpleideal/cobro`](https://github.com/simpleideal/cobro).

## Abrir las muestras

- [Índice](https://simpleideal.github.io/Pagos1/)
- [1 · Boutique](https://simpleideal.github.io/Pagos1/demo-boutique/)
- [2 · Portafolio](https://simpleideal.github.io/Pagos1/demo-portafolio/)
- [3 · Carta](https://simpleideal.github.io/Pagos1/demo-carta/)
- [4 · Conductor](https://simpleideal.github.io/Pagos1/demo-conductor/)

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

## Cómo se cambia

Portafolio: en `demo-portafolio/index.html`, el bloque **DATOS DEL PORTAFOLIO**.

Carta: en `demo-carta/index.html`, el bloque **DATOS DE LA CARTA**.
Cada plato puede llevar varias `fotos`; si hay más de una, rotan
cada 4 segundos.

Conductor: en `demo-conductor/index.html`, el bloque **DATOS DEL CONDUCTOR**.
El PDF de muestra está en `demo-conductor/documentos/permiso-muestra.pdf`
(clave `1234`).
