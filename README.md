# Muestras de llavero NFC

Repositorio para mostrar la interfaz de los llaveros y para probar
integraciones. **Todos los datos de estas páginas son inventados.**

Tres muestras en el índice, tres usos distintos:

1. **Boutique** — cobro (copiar datos de transferencia).
2. **Obras Rivera** — portafolio de trabajos hechos.
3. **Casa Fogón** — carta de restorán (foto, precio y tiempo por plato).

`demo-segunda/` y `demo-taller/` siguen en el repo (otras pieles de cobro)
pero ya no son muestras del índice.

La plantilla de cobro para un cliente real vive en
[`simpleideal/cobro`](https://github.com/simpleideal/cobro).

## Abrir las muestras

- [Índice](https://simpleideal.github.io/Pagos1/)
- [1 · Boutique](https://simpleideal.github.io/Pagos1/demo-boutique/)
- [2 · Portafolio](https://simpleideal.github.io/Pagos1/demo-portafolio/)
- [3 · Carta](https://simpleideal.github.io/Pagos1/demo-carta/)

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

## Cómo se cambia

Portafolio: en `demo-portafolio/index.html`, el bloque **DATOS DEL PORTAFOLIO**.

Carta: en `demo-carta/index.html`, el bloque **DATOS DE LA CARTA**:
`LOCAL`, `CONTACTO`, `SECCIONES` y `PLATOS`.
