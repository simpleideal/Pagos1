#!/usr/bin/env python3
"""Dice si hay lectura pública y si hay clave de editor. No imprime secretos."""

from __future__ import annotations

import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

HOJA_ID = os.environ.get(
    "VITRINA_SHEET_ID",
    "1EWSAq8OtKFsNgJCNUAWDdCjQRloo_B24kZjsLPOuizQ",
)
PESTANA = os.environ.get("VITRINA_SHEET_TAB", "Hoja 1")


def info_cuenta():
    bruto = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON", "").strip()
    if bruto:
        return json.loads(bruto)
    ruta = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS", "").strip()
    if ruta:
        return json.loads(Path(ruta).read_text(encoding="utf-8"))
    return None


def lector():
    q = urllib.parse.urlencode({"tqx": "out:csv", "sheet": PESTANA})
    url = "https://docs.google.com/spreadsheets/d/%s/gviz/tq?%s" % (HOJA_ID, q)
    req = urllib.request.Request(url, headers={"User-Agent": "SimpleIdealVitrina/1"})
    with urllib.request.urlopen(req, timeout=20) as res:
        return res.status, len(res.read())


def editor(info):
    from google.oauth2.service_account import Credentials
    from googleapiclient.discovery import build

    creds = Credentials.from_service_account_info(
        info, scopes=["https://www.googleapis.com/auth/spreadsheets"]
    )
    service = build("sheets", "v4", credentials=creds, cache_discovery=False)
    meta = service.spreadsheets().get(spreadsheetId=HOJA_ID).execute()
    return [s["properties"]["title"] for s in meta.get("sheets", [])]


def main():
    try:
        estado, n = lector()
        print("lector: ok (http %s, %s bytes)" % (estado, n))
    except Exception as err:
        print("lector: falló (%s)" % err.__class__.__name__)

    info = info_cuenta()
    if not info:
        print("editor: sin secreto GOOGLE_SERVICE_ACCOUNT_JSON (normal hasta guardarlo en Cursor)")
        return 0

    correo = info.get("client_email", "(sin client_email)")
    try:
        pestanas = editor(info)
        print("editor: ok (%s) pestañas: %s" % (correo, ", ".join(pestanas)))
    except Exception as err:
        print("editor: hay clave pero no entra (%s). Comparte la hoja con %s como Editor." % (
            err.__class__.__name__, correo
        ))
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
