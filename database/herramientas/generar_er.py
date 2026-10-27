#!/usr/bin/env python3
"""Genera el diagrama ER (DOT -> PNG/SVG) leyendo el esquema real de la base tupa_unsaac.

Uso:  python3 generar_er.py  [directorio_salida]
Requiere: cliente `mysql` con acceso root local y Graphviz (`dot`).
"""
import html
import re
import subprocess
import sys
from collections import defaultdict
from pathlib import Path

DB = "tupa_unsaac"
SALIDA = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent

# Módulo -> (color de cabecera, tablas)
MODULOS = {
    "M1 Acceso y organización": ("#1F4E79", ["roles", "usuarios", "oficinas", "sedes"]),
    "M2 Catálogo TUPA": ("#7A1F2B", ["categorias", "procedimientos", "procedimiento_presentacion", "tarifas_procedimiento",
                                      "requisitos_procedimiento", "recursos_procedimiento"]),
    "M3/M4/M7 Trámites y seguimiento": ("#1E6B4A", ["tramites", "estados_tramite", "historial_tramite"]),
    "M6 Documentos y pagos": ("#8A5A00", ["documentos", "pagos"]),
    "M5 Notificaciones y ayuda": ("#5B3A8C", ["notificaciones", "tickets_ayuda"]),
}


def consulta(sql: str):
    salida = subprocess.run(
        ["mysql", "-uroot", "--default-character-set=utf8mb4", "-N", "-B", "-e", sql],
        check=True, capture_output=True, text=True).stdout
    return [fila.split("\t") for fila in salida.strip().split("\n") if fila]


def tipo_corto(tipo_columna: str) -> str:
    t = tipo_columna.replace(" unsigned", "").replace("tinyint(1)", "bool")
    return re.sub(r"^(tinyint|smallint|int|bigint)\(\d+\)", r"\1", t)  # quita el ancho de visualización


columnas = defaultdict(list)
for tabla, col, tipo, clave, nulo in consulta(
        f"SELECT table_name, column_name, column_type, column_key, is_nullable "
        f"FROM information_schema.columns WHERE table_schema='{DB}' ORDER BY table_name, ordinal_position"):
    columnas[tabla].append((col, tipo_corto(tipo), clave, nulo))

fks = consulta(
    f"SELECT table_name, column_name, referenced_table_name "
    f"FROM information_schema.key_column_usage "
    f"WHERE table_schema='{DB}' AND referenced_table_name IS NOT NULL")
fk_cols = {(t, c) for t, c, _ in fks}

color_de = {t: color for _, (color, tablas) in MODULOS.items() for t in tablas}


def nodo(tabla: str) -> str:
    color = color_de[tabla]
    filas = [f'<TR><TD COLSPAN="3" BGCOLOR="{color}"><FONT COLOR="white"><B>{html.escape(tabla)}</B></FONT></TD></TR>']
    for col, tipo, clave, nulo in columnas[tabla]:
        marca = []
        if clave == "PRI":
            marca.append("PK")
        if (tabla, col) in fk_cols:
            marca.append("FK")
        if clave == "UNI":
            marca.append("UQ")
        nombre = html.escape(col)
        if clave == "PRI":
            nombre = f"<B>{nombre}</B>"
        # Graphviz no admite <B></B> vacío: sin marcas se deja la celda en blanco
        celda_marca = f'<FONT COLOR="{color}"><B>{" ".join(marca)}</B></FONT>' if marca else " "
        filas.append(
            f'<TR><TD ALIGN="LEFT" PORT="{col}">{nombre}</TD>'
            f'<TD ALIGN="LEFT"><FONT COLOR="#555555">{html.escape(tipo)}</FONT></TD>'
            f'<TD>{celda_marca}</TD></TR>')
    return (f'  "{tabla}" [label=<<TABLE BORDER="1" CELLBORDER="0" CELLSPACING="0" CELLPADDING="3" '
            f'BGCOLOR="white" COLOR="{color}">{"".join(filas)}</TABLE>>];')


lineas = [
    "digraph ER {",
    '  graph [rankdir=LR, splines=true, nodesep=0.35, ranksep=1.1, fontname="Helvetica", '
    'labelloc=t, fontsize=22, pad=0.4, '
    'label="Modelo entidad-relación - tupa_unsaac (Plataforma TUPA UNSAAC)"];',
    '  node [shape=plain, fontname="Helvetica", fontsize=10];',
    # padre -> hijo: la barra (tee) queda en el lado "uno" y la pata de gallo (crow) en el lado "muchos"
    '  edge [color="#444444", arrowtail=tee, arrowhead=crow, dir=both, fontname="Helvetica", fontsize=8];',
]
for i, (modulo, (color, tablas)) in enumerate(MODULOS.items()):
    lineas.append(f'  subgraph cluster_{i} {{ label="{modulo}"; fontcolor="{color}"; color="{color}"; '
                  f'style="rounded,dashed"; fontsize=13;')
    lineas.extend("  " + nodo(t) for t in tablas)
    lineas.append("  }")
for tabla, col, destino in fks:
    lineas.append(f'  "{destino}" -> "{tabla}" [taillabel="", headlabel=""];')
lineas.append("}")

SALIDA.mkdir(parents=True, exist_ok=True)
dot_path = SALIDA / "diagrama_er.dot"
dot_path.write_text("\n".join(lineas), encoding="utf-8")
for fmt, extra in (("png", ["-Gdpi=170"]), ("svg", [])):
    subprocess.run(["dot", f"-T{fmt}", *extra, str(dot_path), "-o", str(SALIDA / f"diagrama_er.{fmt}")], check=True)
print("Diagrama generado en", SALIDA)
