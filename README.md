# Muestras de llavero NFC

Repositorio para mostrar la interfaz de los llaveros y para probar
integraciones. **Todos los datos de estas páginas son inventados.**

Tres muestras en el índice:

1. **Boutique** — cobro (copiar datos de transferencia).
2. **Obras Rivera** — portafolio de trabajos hechos.
3. **Taller** — cobro, otra piel.

La 2 no es otra página de transferencia: es un portafolio. Sirve para
cotizar en terreno o una licitación privada. No reemplaza certificados
ni la oferta técnica de Mercado Público / MOP.

`demo-segunda/` sigue en el repo (cobro oscuro) pero ya no es la muestra 2.

La plantilla de cobro para un cliente real vive en
[`simpleideal/cobro`](https://github.com/simpleideal/cobro).

## Abrir las muestras

- [Índice](https://simpleideal.github.io/Pagos1/)
- [1 · Boutique](https://simpleideal.github.io/Pagos1/demo-boutique/)
- [2 · Portafolio](https://simpleideal.github.io/Pagos1/demo-portafolio/)
- [3 · Taller](https://simpleideal.github.io/Pagos1/demo-taller/)

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

## Cómo se cambia el portafolio

En `demo-portafolio/index.html`, el bloque **DATOS DEL PORTAFOLIO**:
`EMPRESA`, `CONTACTO`, `ZONAS` y `OBRAS`. Cada obra lleva una `zona`
(`ciudad`, `lago` o `interior`) para el filtro. La empresa no trabaja
solo en una ciudad.
