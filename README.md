# Muestras de llavero NFC

Repositorio para mostrar la interfaz de los llaveros y para probar
integraciones. **Todos los datos de estas páginas son inventados.**

Hay **dos usos**, no tres productos:

1. **Cobro** — copiar datos de transferencia. Las carpetas `demo-boutique`,
   `demo-segunda` y `demo-taller` son la misma interfaz con otra piel.
2. **Portafolio** — presentarse con obras hechas. Sirve para cotizar en
   terreno o una licitación privada. No reemplaza certificados, contratos
   ni la oferta técnica de Mercado Público / MOP.

La plantilla de cobro que se copia a un cliente real vive en
[`simpleideal/cobro`](https://github.com/simpleideal/cobro).

## Abrir las muestras

Con GitHub Pages:

- [Índice](https://simpleideal.github.io/Pagos1/)
- [Cobro · claro](https://simpleideal.github.io/Pagos1/demo-boutique/)
- [Cobro · oscuro](https://simpleideal.github.io/Pagos1/demo-segunda/)
- [Cobro · taller](https://simpleideal.github.io/Pagos1/demo-taller/)
- [Portafolio · Obras Rivera](https://simpleideal.github.io/Pagos1/demo-portafolio/)

En local:

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

## Cómo se cambia el portafolio

En `demo-portafolio/index.html`, el bloque **DATOS DEL PORTAFOLIO**:
`EMPRESA`, `CONTACTO` y `OBRAS`. Cada obra lleva título, lugar, año,
metros, una nota y una foto.

En un llavero real las fotos son del cliente. Las de la muestra son de
Unsplash, solo para el vídeo y la oferta.
