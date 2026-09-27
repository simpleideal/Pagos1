#!/usr/bin/env python3
"""Arma la plantilla .xlsx para importar en Google Sheets."""

import csv
from pathlib import Path

from openpyxl import Workbook
from openpyxl.comments import Comment
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parent
CSV = ROOT / "plantilla.csv"
XLSX = ROOT / "plantilla-google-sheets.xlsx"

COLS = [
    ("Producto", "Nombre que ve el cliente. No lo dejes vacío.", 28, "texto"),
    ("Precio normal", "Precio de vitrina, solo números, sin $.", 16, "numero"),
    ("Precio oferta", "Precio de hoy. Si va vacío, se usa el normal.", 16, "numero"),
    ("Hoy", "si o no. Solo si sale en la vitrina.", 10, "sino"),
    ("Activo", "si o no. no = ni se publica.", 10, "sino"),
    ("Nota", "Una línea. Puede ir vacía.", 42, "texto"),
    ("Foto", "URL https://… o vacío.", 28, "texto"),
    ("Unidades", "Número. 0 = Agotado. Vacío = no se muestra el cupo.", 12, "numero"),
    ("Categoría", "Opcional. Agrupa: Horno, Para llevar…", 16, "texto"),
]

COMENTARIO = (
    "No cambies estos títulos.\n"
    "La vitrina lee esta pestaña."
)


def leer_filas():
    with CSV.open(encoding="utf-8", newline="") as fh:
        filas = list(csv.reader(fh))
    encabezado = filas[0]
    return encabezado, filas[1:]


def estilo_cabecera(celda, relleno):
    celda.font = Font(bold=True, color="FFFFFFFF", name="Calibri", size=11)
    celda.fill = PatternFill("solid", fgColor=relleno)
    celda.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
    celda.border = Border(
        left=Side(style="thin", color="FF1F3F28"),
        right=Side(style="thin", color="FF1F3F28"),
        top=Side(style="thin", color="FF1F3F28"),
        bottom=Side(style="thin", color="FF1F3F28"),
    )


def armar():
    encabezado, filas = leer_filas()
    assert encabezado == [c[0] for c in COLS], encabezado

    wb = Workbook()
    ofertas = wb.active
    ofertas.title = "Hoja 1"

    fill_base = "FF2F5D3A"
    fill_hoy = "FFC45C26"
    tipos = {c[0]: c[3] for c in COLS}
    for i, (nombre, ayuda, ancho, _tipo) in enumerate(COLS, start=1):
        celda = ofertas.cell(1, i, nombre)
        estilo_cabecera(celda, fill_hoy if nombre == "Hoy" else fill_base)
        celda.comment = Comment(ayuda + "\n\n" + COMENTARIO, "Simple Ideal")
        ofertas.column_dimensions[get_column_letter(i)].width = ancho

    for r, fila in enumerate(filas, start=2):
        for c, valor in enumerate(fila, start=1):
            nombre = encabezado[c - 1]
            celda = ofertas.cell(r, c)
            if tipos[nombre] == "numero" and valor != "":
                celda.value = int(valor)
                celda.number_format = "#,##0"
            else:
                celda.value = valor
            if nombre == "Hoy" and str(valor).lower() == "si":
                celda.fill = PatternFill("solid", fgColor="FFF7E3C6")
            if nombre == "Unidades" and valor == "0":
                celda.fill = PatternFill("solid", fgColor="FFF4D4C8")
            celda.alignment = Alignment(vertical="center", wrap_text=True)

    ofertas.freeze_panes = "A2"
    ofertas.auto_filter.ref = f"A1:I{len(filas) + 1}"
    ofertas.row_dimensions[1].height = 28
    ofertas.sheet_properties.tabColor = "2F5D3A"

    si_no = DataValidation(
        type="list",
        formula1='"si,no"',
        allow_blank=True,
        showDropDown=False,
        showErrorMessage=True,
        errorTitle="Usa si o no",
        error="Elige si o no, en minúscula.",
        promptTitle="Hoy / Activo",
        prompt="si o no",
        showInputMessage=True,
    )
    ofertas.add_data_validation(si_no)
    si_no.add("D2:D200")
    si_no.add("E2:E200")

    uso = wb.create_sheet("Cómo usar")
    uso.sheet_properties.tabColor = "C45C26"
    uso.column_dimensions["A"].width = 88
    uso["A1"] = "Cómo usar esta hoja (el local no entra a GitHub)"
    uso["A1"].font = Font(bold=True, size=14, color="FF2F5D3A")
    lineas_uso = [
        "",
        "Esta pestaña no se publica. La vitrina lee solo Hoja 1.",
        "",
        "Cada tarde:",
        "1. Lo que quieres liquidar: Hoy = si. Completa Precio oferta y Unidades.",
        "2. Lo demás: Hoy = no.",
        "3. Si se acabó: Unidades = 0 (sale Agotado).",
        "4. Si un producto no debe verse nunca: Activo = no.",
        "",
        "No cambies la fila 1 (los títulos verdes).",
        "No pongas $ en los precios. Solo el número: 4500.",
        "Foto puede ir vacía.",
        "",
        "Hoy y Activo tienen un menú: elige si o no.",
        "Una vez (Simple Ideal): Compartir → cualquiera con el enlace puede ver.",
        "Para otro local: Archivo → Hacer una copia.",
    ]
    for i, texto in enumerate(lineas_uso, start=2):
        uso.cell(i, 1, texto)
        uso.cell(i, 1).alignment = Alignment(wrap_text=True)
        uso.row_dimensions[i].height = 18

    wb.save(XLSX)
    print("escrito", XLSX)


if __name__ == "__main__":
    armar()
