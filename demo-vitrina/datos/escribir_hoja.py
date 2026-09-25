#!/usr/bin/env python3
"""Escribe la plantilla en Google Sheets con una cuenta de servicio.

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


def main():
    info = credenciales()
    correo = info.get("client_email", "")
    filas = filas_plantilla()

    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build

    scopes = ["https://www.googleapis.com/auth/spreadsheets"]
    creds = Credentials.from_service_account_info(info, scopes=scopes)
    service = build("sheets", "v4", credentials=creds, cache_discovery=False)
    sheet = service.spreadsheets()

    meta = sheet.get(spreadsheetId=HOJA_ID).execute()
    titulos = [s["properties"]["title"] for s in meta.get("sheets", [])]
    if PESTANA not in titulos:
        sys.exit("Pestaña %r no está. Hay: %s" % (PESTANA, ", ".join(titulos)))

    rango = "'%s'!A1" % PESTANA.replace("'", "''")
    sheet.values().update(
        spreadsheetId=HOJA_ID,
        range=rango,
        valueInputOption="RAW",
        body={"values": filas},
    ).execute()
    print("ok: escribí %s filas en pestaña %s (cuenta %s)" % (len(filas), PESTANA, correo))


if __name__ == "__main__":
    main()
