# Notas para agentes

Hay tres tipos de muestra. No se mezclan: cobro (1), portafolio (2),
carta o vitrina (3).

## Vitrina (`demo-vitrina/`)

La pastelería marca `hoy` / `precio_oferta` / `unidades` en Google
Sheets. **No** las marques tú cada tarde.

La página **lee** con el vínculo de lector (`FUENTE.hoja` en
`demo-vitrina/index.html`).

Para **escribir** plantillas o papeles (no para operar el local) usa
la cuenta de servicio:

- Secreto de Cursor: `GOOGLE_SERVICE_ACCOUNT_JSON` (Runtime Secret,
  nunca en git)
- Compartir la hoja con el `client_email` de ese JSON, como editor
- Scripts: `demo-vitrina/datos/escribir_hoja.py` y
  `demo-vitrina/datos/comprobar_acceso.py`
- Pasos: `demo-vitrina/HOJA.md`

Un agente que arrancó **antes** de guardar el secreto no lo ve.
Hace falta uno nuevo.

En el escritorio, MCP de Google Sheets usa la sesión del usuario.
Eso no sustituye el secreto en un agente en la nube.
