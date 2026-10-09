# Carta con idiomas (Fogón del Lago)

Página aparte de Casa Fogón y de Cervecería Bruma. Solo la carta,
con Español (por defecto), English y Português. El idioma se guarda
en el navegador (`fogon-lago-idioma`). El detalle de la hoja está
en `HOJA.md`; aquí queda el camino para repetir el trabajo.

El local no entra a GitHub: edita una hoja. Si `FUENTE.carta` está
vacía o la hoja no responde, se muestra `datos/carta.csv`.

## Crear la hoja y pegar la URL

1. En Drive: **Nuevo → Hojas de cálculo**.
2. Fila 1, en este orden:

   `nombre`, `estilo`, `categoria`, `precio`, `disponible`,
   `descripcion`, `nombre_en`, `estilo_en`, `descripcion_en`,
   `nombre_pt`, `estilo_pt`, `descripcion_pt`, `foto`,
   `audio_es`, `audio_en`, `audio_pt`

3. Desde la fila 2, un plato por fila.
   - `categoria`: `platos`, `bebidas` o `postres`
   - `disponible`: `si` o `no` (`no` sale atenuado, como agotado)
   - `precio`: pesos, sin `$`
   - `foto`: URL `https://…` o vacía
4. **Archivo → Compartir → Publicar en la web**.
   Pestaña de la carta → **Valores separados por comas (.csv)** →
   **Publicar**. Copia el enlace.
5. En `demo-carta-idiomas/index.html`, busca **PEGA LA URL** y pega
   ese enlace en `FUENTE.carta`.

## Traducir con la hoja

Las columnas `_en` y `_pt` son opcionales. Si faltan o van vacías,
la página muestra el español.

En una hoja en español, el punto y coma separa los argumentos.
Al lado del nombre (columna A), en la fila 2:

```
=GOOGLETRANSLATE(A2;"es";"en")
=GOOGLETRANSLATE(A2;"es";"pt")
```

Lo mismo para el estilo y la descripción, cambiando la columna.
Si la hoja usa coma en las fórmulas:

```
=GOOGLETRANSLATE(A2,"es","en")
```

Arrastra la fórmula hacia abajo. No hace falta volver a publicar:
al recargar la página se lee el CSV de nuevo.

El botón de WhatsApp siempre manda el mensaje en español, porque lo
lee el local. En la muestra: «Hola, quiero reservar una mesa en
Fogón del Lago.»

## Voz: MP3 y, si no hay, el navegador

El botón 🔊 de cada plato prueba primero un MP3. Si no está o falla,
usa `speechSynthesis` en el idioma elegido y no muestra un error.

`audio_es`, `audio_en` y `audio_pt` son opcionales. En la celda va
una URL `https://…` o una ruta dentro de `demo-carta-idiomas/audio/`.
Si la escribes a mano, usa el mismo nombre que el archivo, por
ejemplo `audio/pastel-de-choclo.es.mp3`.

Si la celda está vacía, el botón busca:

`audio/<nombre-del-plato-sin-tildes>.<idioma>.mp3`

El nombre sale siempre del plato en español, aunque la carta esté
en inglés o en portugués. Va en minúsculas, sin tildes y sin ñ
(la ñ pasa a n). Los espacios y el resto de símbolos pasan a un
guion. El idioma va después de un punto: `es`, `en` o `pt`.

Ejemplo: **Pastel de choclo**

- español: `audio/pastel-de-choclo.es.mp3`
- inglés: `audio/pastel-de-choclo.en.mp3`
- portugués: `audio/pastel-de-choclo.pt.mp3`

Ese es el formato que deja el cuaderno de Colab. Un nombre con eñe,
como «Piñón», queda `pinon`.

Los MP3 no van en este repo por ahora. Se pueden grabar con
VibeVoice en Colab, o con otra voz neuronal, y dejarlos en `audio/`
o pegar su URL en la hoja. No hay una acción de GitHub que los genere.
