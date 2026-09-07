# Muestras de llavero NFC

Repositorio para mostrar la interfaz de los llaveros y para probar
integraciones. **Todos los datos de estas páginas son inventados.**

La plantilla que se copia a un cliente real vive en
[`simpleideal/cobro`](https://github.com/simpleideal/cobro). Este repo no
reemplaza a ese; acá no hay personas ni negocios verdaderos.

## Abrir las muestras

Con GitHub Pages:

- [Índice](https://simpleideal.github.io/Pagos1/)
- [Boutique · Luna Atelier](https://simpleideal.github.io/Pagos1/demo-boutique/)
- [Segunda mano · Verde Segunda](https://simpleideal.github.io/Pagos1/demo-segunda/)
- [Taller · Taller Norte](https://simpleideal.github.io/Pagos1/demo-taller/)

En local:

```bash
python3 -m http.server 8080 --bind 0.0.0.0
```

Luego `http://localhost:8080/`.

## Qué muestra cada carpeta

| Carpeta | Negocio inventado | Interfaz |
| --- | --- | --- |
| `demo-boutique/` | Luna Atelier | Tema claro, dos bancos, Instagram |
| `demo-segunda/` | Verde Segunda | Tema oscuro, dos bancos, Instagram y Facebook |
| `demo-taller/` | Taller Norte | Foto de fondo, una cuenta, sin redes |

Los motores salen de las plantillas ya usadas en producción (La Nico, CH Moda
y `cobro`). Solo se cambió el bloque **DATOS DEL CLIENTE**.

## Agregar otra muestra

1. Copiar una carpeta `demo-*`.
2. Editar en `index.html` únicamente el bloque entre `DATOS DEL CLIENTE` y
   `FIN DE LOS DATOS DEL CLIENTE`.
3. Enlazarla desde el `index.html` de la raíz.

No hay que copiar ramas de los repositorios de clientes: esas ramas ya están
en su `main` y traen datos reales.
