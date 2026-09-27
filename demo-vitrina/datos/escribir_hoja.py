#!/usr/bin/env python3
"""Escribe y formatea la plantilla en Google Sheets.

No guarda claves. Lee GOOGLE_SERVICE_ACCOUNT_JSON (el JSON entero) o
GOOGLE_APPLICATION_CREDENTIALS (ruta a un archivo que no debe estar en git).
"""

from __future__ import annotations

import csv
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CSV = ROOT / "plantilla.csv"
HOJA_ID = os.environ.get(
    "VITRINA_SHEET_ID",
    "1EWSAq8OtKFsNgJCNUAWDdCjQRloo_B24kZjsLPOuizQ",
)
PESTANA = os.environ.get("VITRINA_SHEET_TAB", "Hoja 1")
PESTANA_USO = "Cómo usar"

# Anchos en píxeles: producto, precios, hoy, activo, nota, foto, unidades, categoría
ANCHOS = [220, 130, 130, 88, 88, 260, 200, 110, 140]
NUMEROS = {1, 2, 7}  # Precio normal, Precio oferta, Unidades
SI_NO = {3, 4}  # Hoy, Activo
AYUDA_CABECERA = [
    "Nombre que ve el cliente.",
    "Precio de vitrina. Solo el número, sin $.",
    "Precio de hoy. Si va vacío, se usa el normal.",
    "si = sale en la vitrina de hoy. no = no sale.",
    "si = el producto existe. no = no se publica nunca.",
    "Una línea. Puede ir vacía.",
    "Enlace https://… o vacío.",
    "Número. 0 = Agotado. Vacío = no se muestra el cupo.",
    "Opcional. Agrupa: Horno, Para llevar…",
]
USO = [
    ["Cómo usar esta hoja"],
    [""],
    ["Esta pestaña no se publica. La vitrina lee solo Hoja 1."],
    [""],
    ["Cada tarde:"],
    ["1. Lo que quieres liquidar: Hoy = si. Completa Precio oferta y Unidades."],
    ["2. Lo demás: Hoy = no."],
    ["3. Si se acabó: Unidades = 0 (sale Agotado)."],
    ["4. Si un producto no debe verse nunca: Activo = no."],
    [""],
    ["No cambies la fila 1 (los títulos verdes)."],
    ["No pongas $ en los precios. Solo el número: 4500."],
    ["Foto puede ir vacía."],
    [""],
    ["Hoy y Activo tienen un menú: elige si o no. No hace falta escribir."],
]


def credenciales():
    bruto = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()
    if bruto:
        return json.loads(bruto)
    ruta = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    if ruta:
        return json.loads(Path(ruta).read_text(encoding="utf-8"))
    sys.exit(
        "Falta GOOGLE_SERVICE_ACCOUNT_JSON. "
        "Guárdalo como Runtime Secret en Cursor, no en el repo."
    )


def filas_plantilla():
    with CSV.open(encoding="utf-8", newline="") as fh:
        return list(csv.reader(fh))


def rgb(hex_color):
    h = hex_color.lstrip("#")
    return {
        "red": int(h[0:2], 16) / 255,
        "green": int(h[2:4], 16) / 255,
        "blue": int(h[4:6], 16) / 255,
    }


def color(hex_color):
    return {"red": rgb(hex_color)["red"], "green": rgb(hex_color)["green"], "blue": rgb(hex_color)["blue"]}


def sheet_por_titulo(meta, titulo):
    for s in meta.get("sheets", []):
        if s["properties"]["title"] == titulo:
            return s
    return None


def pedidos_formato(sheet_id, n_filas, n_cols):
    verde = color("2F5D3A")
    miel = color("C45C26")
    fondo = color("F4EFE4")
    blanco = color("FFFFFF")
    texto = color("241C14")
    pedidos = []

    pedidos.append({
        "updateSheetProperties": {
            "properties": {
                "sheetId": sheet_id,
                "gridProperties": {
                    "frozenRowCount": 1,
                    "rowCount": max(n_filas + 40, 80),
                    "columnCount": n_cols,
                },
                "tabColorStyle": {"rgbColor": verde},
            },
            "fields": "gridProperties.frozenRowCount,gridProperties.rowCount,gridProperties.columnCount,tabColorStyle",
        }
    })

    for i, px in enumerate(ANCHOS[:n_cols]):
        pedidos.append({
            "updateDimensionProperties": {
                "range": {
                    "sheetId": sheet_id,
                    "dimension": "COLUMNS",
                    "startIndex": i,
                    "endIndex": i + 1,
                },
                "properties": {"pixelSize": px},
                "fields": "pixelSize",
            }
        })

    pedidos.append({
        "updateDimensionProperties": {
            "range": {
                "sheetId": sheet_id,
                "dimension": "ROWS",
                "startIndex": 0,
                "endIndex": 1,
            },
            "properties": {"pixelSize": 36},
            "fields": "pixelSize",
        }
    })

    cabecera_vals = []
    for i, ayuda in enumerate(AYUDA_CABECERA[:n_cols]):
        fondo_h = miel if i == 3 else verde
        cabecera_vals.append({
            "note": ayuda,
            "userEnteredFormat": {
                "backgroundColor": fondo_h,
                "horizontalAlignment": "CENTER",
                "verticalAlignment": "MIDDLE",
                "wrapStrategy": "WRAP",
                "textFormat": {
                    "foregroundColor": blanco,
                    "fontFamily": "Calibri",
                    "fontSize": 11,
                    "bold": True,
                },
            },
        })
    pedidos.append({
        "repeatCell": {
            "range": {
                "sheetId": sheet_id,
                "startRowIndex": 1,
                "endRowIndex": max(n_filas, 2),
                "startColumnIndex": 0,
                "endColumnIndex": n_cols,
            },
            "cell": {
                "userEnteredFormat": {
                    "verticalAlignment": "MIDDLE",
                    "wrapStrategy": "WRAP",
                    "textFormat": {"fontFamily": "Calibri", "fontSize": 11, "foregroundColor": texto},
                }
            },
            "fields": "userEnteredFormat.verticalAlignment,userEnteredFormat.wrapStrategy,userEnteredFormat.textFormat",
        }
    })

    for col in NUMEROS:
        if col >= n_cols:
            continue
        pedidos.append({
            "repeatCell": {
                "range": {
                    "sheetId": sheet_id,
                    "startRowIndex": 1,
                    "startColumnIndex": col,
                    "endColumnIndex": col + 1,
                },
                "cell": {
                    "userEnteredFormat": {
                        "numberFormat": {"type": "NUMBER", "pattern": "#,##0"},
                        "horizontalAlignment": "RIGHT",
                    }
                },
                "fields": "userEnteredFormat.numberFormat,userEnteredFormat.horizontalAlignment",
            }
        })

    for col in SI_NO:
        if col >= n_cols:
            continue
        pedidos.append({
            "repeatCell": {
                "range": {
                    "sheetId": sheet_id,
                    "startRowIndex": 1,
                    "endRowIndex": 200,
                    "startColumnIndex": col,
                    "endColumnIndex": col + 1,
                },
                "cell": {
                    "dataValidation": {
                        "condition": {
                            "type": "ONE_OF_LIST",
                            "values": [
                                {"userEnteredValue": "si"},
                                {"userEnteredValue": "no"},
                            ],
                        },
                        "showCustomUi": True,
                        "strict": True,
                    },
                    "userEnteredFormat": {"horizontalAlignment": "CENTER"},
                },
                "fields": "dataValidation,userEnteredFormat.horizontalAlignment",
            }
        })

    pedidos.append({
        "addConditionalFormatRule": {
            "rule": {
                "ranges": [{
                    "sheetId": sheet_id,
                    "startRowIndex": 1,
                    "startColumnIndex": 3,
                    "endColumnIndex": 4,
                }],
                "booleanRule": {
                    "condition": {"type": "TEXT_EQ", "values": [{"userEnteredValue": "si"}]},
                    "format": {"backgroundColor": color("F7E3C6"), "textFormat": {"bold": True}},
                },
            },
            "index": 0,
        }
    })
    pedidos.append({
        "addConditionalFormatRule": {
            "rule": {
                "ranges": [{
                    "sheetId": sheet_id,
                    "startRowIndex": 1,
                    "startColumnIndex": 7,
                    "endColumnIndex": 8,
                }],
                "booleanRule": {
                    "condition": {"type": "NUMBER_EQ", "values": [{"userEnteredValue": "0"}]},
                    "format": {"backgroundColor": color("F4D4C8"), "textFormat": {"bold": True}},
                },
            },
            "index": 1,
        }
    })

    pedidos.append({
        "addBanding": {
            "bandedRange": {
                "range": {
                    "sheetId": sheet_id,
                    "startRowIndex": 0,
                    "endRowIndex": max(n_filas, 2),
                    "startColumnIndex": 0,
                    "endColumnIndex": n_cols,
                },
                "rowProperties": {
                    "headerColor": verde,
                    "firstBandColor": blanco,
                    "secondBandColor": fondo,
                },
            }
        }
    })

    pedidos.append({
        "setBasicFilter": {
            "filter": {
                "range": {
                    "sheetId": sheet_id,
                    "startRowIndex": 0,
                    "endRowIndex": n_filas,
                    "startColumnIndex": 0,
                    "endColumnIndex": n_cols,
                }
            }
        }
    })
    # Después de las bandas, para que Hoy quede naranja y no verde.
    pedidos.append({
        "updateCells": {
            "rows": [{"values": cabecera_vals}],
            "fields": "note,userEnteredFormat",
            "start": {"sheetId": sheet_id, "rowIndex": 0, "columnIndex": 0},
        }
    })
    return pedidos


def limpiar_formato_previo(service, hoja):
    pedidos = []
    sid = hoja["properties"]["sheetId"]
    for b in hoja.get("bandedRanges", []):
        pedidos.append({"deleteBanding": {"bandedRangeId": b["bandedRangeId"]}})
    n_reglas = len(hoja.get("conditionalFormats", []))
    for i in range(n_reglas - 1, -1, -1):
        pedidos.append({
            "deleteConditionalFormatRule": {"sheetId": sid, "index": i}
        })
    if hoja.get("basicFilter"):
        pedidos.append({"clearBasicFilter": {"sheetId": sid}})
    if pedidos:
        service.spreadsheets().batchUpdate(
            spreadsheetId=HOJA_ID, body={"requests": pedidos}
        ).execute()


def asegurar_uso(service, meta):
    hoja = sheet_por_titulo(meta, PESTANA_USO)
    pedidos = []
    if hoja is None:
        pedidos.append({
            "addSheet": {
                "properties": {
                    "title": PESTANA_USO,
                    "tabColorStyle": {"rgbColor": color("C45C26")},
                    "gridProperties": {"rowCount": 30, "columnCount": 1},
                }
            }
        })
        res = service.spreadsheets().batchUpdate(
            spreadsheetId=HOJA_ID, body={"requests": pedidos}
        ).execute()
        sid = res["replies"][0]["addSheet"]["properties"]["sheetId"]
    else:
        sid = hoja["properties"]["sheetId"]

    service.spreadsheets().values().update(
        spreadsheetId=HOJA_ID,
        range="'%s'!A1" % PESTANA_USO.replace("'", "''"),
        valueInputOption="RAW",
        body={"values": USO},
    ).execute()
    service.spreadsheets().batchUpdate(
        spreadsheetId=HOJA_ID,
        body={"requests": [
            {
                "updateDimensionProperties": {
                    "range": {
                        "sheetId": sid,
                        "dimension": "COLUMNS",
                        "startIndex": 0,
                        "endIndex": 1,
                    },
                    "properties": {"pixelSize": 560},
                    "fields": "pixelSize",
                }
            },
            {
                "repeatCell": {
                    "range": {
                        "sheetId": sid,
                        "startRowIndex": 0,
                        "endRowIndex": 1,
                        "startColumnIndex": 0,
                        "endColumnIndex": 1,
                    },
                    "cell": {
                        "userEnteredFormat": {
                            "textFormat": {
                                "bold": True,
                                "fontSize": 14,
                                "foregroundColor": color("2F5D3A"),
                            }
                        }
                    },
                    "fields": "userEnteredFormat.textFormat",
                }
            },
        ]},
    ).execute()


def main():
    info = credenciales()
    correo = info.get("client_email", "")
    filas = filas_plantilla()
    if not filas:
        sys.exit("plantilla.csv está vacía")

    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build

    scopes = ["https://www.googleapis.com/auth/spreadsheets"]
    creds = Credentials.from_service_account_info(info, scopes=scopes)
    service = build("sheets", "v4", credentials=creds, cache_discovery=False)
    sheet = service.spreadsheets()

    meta = sheet.get(
        spreadsheetId=HOJA_ID,
        fields="sheets.properties,sheets.bandedRanges,sheets.conditionalFormats,sheets.basicFilter",
    ).execute()
    hoja = sheet_por_titulo(meta, PESTANA)
    if hoja is None:
        titulos = [s["properties"]["title"] for s in meta.get("sheets", [])]
        sys.exit("Pestaña %r no está. Hay: %s" % (PESTANA, ", ".join(titulos)))

    limpiar_formato_previo(service, hoja)
    sid = hoja["properties"]["sheetId"]
    n_cols = len(filas[0])
    rango = "'%s'" % PESTANA.replace("'", "''")
    sheet.values().clear(spreadsheetId=HOJA_ID, range=rango).execute()
    sheet.values().update(
        spreadsheetId=HOJA_ID,
        range=rango + "!A1",
        valueInputOption="USER_ENTERED",
        body={"values": filas},
    ).execute()
    sheet.batchUpdate(
        spreadsheetId=HOJA_ID,
        body={"requests": pedidos_formato(sid, len(filas), n_cols)},
    ).execute()

    meta = sheet.get(spreadsheetId=HOJA_ID, fields="sheets.properties").execute()
    asegurar_uso(service, meta)
    print(
        "ok: escribí %s filas con formato en pestaña %s (cuenta %s)"
        % (len(filas), PESTANA, correo)
    )


if __name__ == "__main__":
    main()
