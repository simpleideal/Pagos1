# Cómo se arma la vitrina (sin tocar GitHub)

La pastelería no edita código. Edita una hoja. Esta página lee esa hoja
y muestra **ofertas de hoy**, no una carta completa.

En GitHub **sí hay plantillas de la comunidad** para el truco de “la
hoja es el menú”. Ninguna es un clon de SheetRocket ni está hecha para
sobras de pastelería en Chile. Lo que copiamos es el **molde**, no el
producto comercial.

## De dónde sale este molde

| Repo / receta | Qué sirve | Qué no copiamos |
| --- | --- | --- |
| [kevin-vaghasiya/restaurant-menu-webapp-gas](https://github.com/kevin-vaghasiya/restaurant-menu-webapp-gas) | Hoja = CMS. Pestañas Settings / Categories / Menu. QR a una URL. [Planilla demo](https://docs.google.com/spreadsheets/d/1fFQ3Way0qLuc6Z1QsqIu8E-8URorVDQwxGII8pnGeW4/edit) | Apps Script: el local tendría que desplegar un Web App. Acá la página vive en GitHub Pages. |
| [MrHawking655/cafe-menu-system](https://github.com/MrHawking655/cafe-menu-system) | Stock / agotado, cards en el teléfono, pedido por WhatsApp. Lee la hoja con [opensheet](https://github.com/benborgers/opensheet) | Carrito y pedido a mesa. Esta vitrina reserva por WhatsApp, sin carrito. |
| [lucascervera/sheet2web](https://github.com/lucascervera/sheet2web) | `Archivo → Compartir → Publicar en la web → CSV`. GitHub Pages. CSV local de respaldo. | Directorio genérico, no vitrina de precios. |
| [fancypams/google-sheets-menu](https://github.com/fancypams/google-sheets-menu) | [sheetrock.js](https://github.com/chriszarate/sheetrock): URL pública de la hoja + plantilla HTML | Depende de jQuery/Handlebars. Acá es un HTML solo. |
| [abqariyuh/Resto-Google-Sheets-Menu](https://github.com/abqariyuh/Resto-Google-Sheets-Menu) | [Planilla de 3 columnas](https://docs.google.com/spreadsheets/d/1GbXxAkgTFVERTEAvrw-4MCULrhWzR3h4Uy5XnoI467E/view) (sección, ítem, precio) | Pide API key de Google. Eso no lo puede mantener un local. |
| SheetRocket / Foodee | Idea de producto: link o QR, el dueño edita la hoja | De pago, carta mensual, no vitrina de cierre. |

Otras recetas del mismo patrón, por si hace falta mirar: [BaruzoTech](https://www.baruzotech.com/blogs/how-to-create-a-digital-qr-menu-for-restaurants-using-google-spreadsheet-and-google-apps-script-easy-free-solution) (el tutorial del repo de Kevin), [foodmenu.app](https://foodmenu.app/) (Glide), el POS de [LBC en itch.io](https://g2g2.itch.io/lbcordersys) (CSV + un `index.html`).

## Qué hace el local cada tarde

1. Abre la hoja de Google (la misma de siempre).
2. En lo que quiere liquidar: `hoy` = `si`, `precio_oferta` y `unidades`.
3. En lo demás: `hoy` = `no`.
4. Si se acabó: `unidades` = `0` (sale **Agotado**).
5. Si un producto no debe verse nunca: `activo` = `no`.

No publica de nuevo. No entra a GitHub. El llavero NFC y el QR siguen
abriendo la misma URL.

## Cómo se crea la plantilla en Google Sheets

1. En Drive: **Nuevo → Hojas de cálculo**.
2. **Archivo → Importar → Subir** y elige
   `demo-vitrina/datos/plantilla-google-sheets.xlsx`
   (también sirve `plantilla.csv`).
3. Importar a **una hoja nueva**. Renombra esa pestaña a `ofertas`.
   No toques la fila 1.
4. **Compartir** → **Cualquier persona con el enlace** → **Lector**.
   Con eso la vitrina lee y un agente puede comprobarla. No pongas
   Editor para cualquiera: el enlace quedaría abierto a borrar precios.
5. Copia el enlace (el de `/edit` sirve) y pégalo en el chat o, una vez,
   en `demo-vitrina/index.html` → `FUENTE.hoja`.

```js
hoja: 'https://docs.google.com/spreadsheets/d/PEGA_EL_ID/edit#gid=0',
pestana: 'ofertas',
```

Para otro local: **Archivo → Hacer una copia**. Cada pastelería tiene
su hoja.

Opcional: **Archivo → Compartir → Publicar en la web** → pestaña
`ofertas` → **Valores separados por comas (.csv)** → Publicar.

También sirve pegar el CSV publicado, o solo el ID de la hoja (entonces
se usa [opensheet](https://opensheet.elk.sh)).

Si la hoja falla, la página usa `datos/ofertas.csv` para no quedar en
blanco (eso es el truco de sheet2web).

## Columnas

| Columna | Qué va |
| --- | --- |
| `producto` | Nombre que ve el cliente |
| `precio_normal` | Precio de vitrina, en pesos, sin `$` |
| `precio_oferta` | Precio de hoy. Si va vacío, se muestra el normal |
| `hoy` | `si` o `no`. Solo `si` sale en la vitrina |
| `activo` | `si` o `no`. `no` = ni se publica |
| `nota` | Una línea |
| `foto` | URL `https://…` o ruta local (`fotos/kuchen.jpg`). Puede ir vacía |
| `unidades` | Número. `0` = Agotado. Vacío = no se muestra el cupo |
| `categoria` | Opcional. Si hay, agrupa (Horno, Para llevar…) |

La página también entiende encabezados de las plantillas de GitHub
(`name`, `price`, `image`, `description`, `stok`, `category`) para no
romper una hoja copiada de otro repo.

## Probar el estado vacío

Abre `demo-vitrina/?csv=datos/ofertas-sin-hoy.csv`. Ahí todo tiene
`hoy=no` o `activo=no`: se ve el aviso de que hoy no hay ofertas.
