#!/usr/bin/env python3
"""Convierte el JSON extraído del TUPA en:
  - database/03_catalogo_tupa.sql   (INSERT de categorías, oficinas, procedimientos, tarifas, requisitos y recursos)
  - web/js/datos-tupa.js            (catálogo para las interfaces)

Uso:  python3 -I generar_catalogo.py  tupa.json  ruta_del_repo
"""
import json
import re
import sys
import unicodedata
from pathlib import Path

fichas = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
repo = Path(sys.argv[2])


def plano(s: str) -> str:
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower().strip()


# ---- sedes (TUPA, sección 4) -------------------------------------------------
SEDES = [
    ("Ciudad Universitaria", "Cusco - Av. De La Cultura N° 733", "Lunes a Viernes de 07:15 a 14:45", 0),
    ("Rectorado (Secretaría General)", "Cusco - Calle Tigre N° 110", "Lunes a Viernes de 07:15 a 13:00", 0),
    ("Filial Sicuani", "Sicuani - Av. Arequipa N° 150", "Lunes a Viernes de 07:15 a 15:00", 1),
    ("Filial Puerto Maldonado", "Tambopata, Madre de Dios - Calle Piura N° 1056", "Lunes a Viernes de 07:15 a 15:00", 1),
    ("Filial Santo Tomás", "Santo Tomás, Chumbivilcas - Av. de la Cultura S/N Sector Accopampa", "Lunes a Viernes de 07:15 a 15:00", 1),
    ("Filial Espinar", "Espinar - Av. Circunvalación S/N", "Lunes a Viernes de 07:15 a 15:00", 1),
    ("Filial Yanaoca", "Yanaoca, Canas - Av. Tupac Amaru S/N", "Lunes a Viernes de 07:15 a 15:00", 1),
    ("Filial Andahuaylas", "Andahuaylas, Apurímac - Jr. Los Girasoles S/N Pochccota", "Lunes a Viernes de 07:15 a 15:00", 1),
    ("Paraninfo Universitario", "Cusco - Plaza de Armas S/N", "Lunes a Viernes de 07:15 a 13:00", 0),
]
SEDE_ID = {plano(n): i + 1 for i, (n, *_r) in enumerate(SEDES)}
SEDE_ID[plano("Rectorado (Secretaria General)")] = 2

# ---- oficinas: nombre normalizado -> (nombre, sigla, sede por defecto) ------
NORMALIZAR = {
    "mesa de partes facultad": "Mesa de Partes de la Facultad",
    "direccion del centro de computo": "Dirección del Centro de Cómputo",
    "secretaria del centro de computo": "Secretaría del Centro de Cómputo",
    "secretaria general": "Secretaría General",
    "unidad de tramite documentario": "Unidad de Trámite Documentario",
}
SIGLAS = {
    "Unidad de Trámite Documentario": "UTD", "Mesa de Partes de la Facultad": "MPF",
    "Decanato de la Facultad": "DECANATO", "Rectorado": "RECTORADO", "Secretaría General": "SG",
    "Vice Rectorado Académico": "VRAC", "Consejo Universitario": "CU", "Centro de Cómputo": "CC",
    "Dirección del Centro de Cómputo": "DIR-CC", "Secretaría del Centro de Cómputo": "SEC-CC",
    "Dirección General de Administración": "DGA", "Dirección General de Admisión": "DGAD",
    "Dirección de Biblioteca Central": "DBC", "Secretaría de Biblioteca Central": "SEC-BC",
    "Dirección de Red de Comunicaciones": "DRC", "Dirección de Registros y Servicios Académicos": "DRSA",
    "Dirección de Sistemas de Información": "DSI", "Dirección de Gestión Académica": "DGAC", "Dirección de la Escuela de Posgrado": "DEP",
    "Secretaría de la Sede Sicuani": "SEC-SICUANI", "Secretaría de la Sede Puerto Maldonado": "SEC-PTOMALD",
    "Secretaría de la Sede Santo Tomás": "SEC-STOMAS", "Secretaría de la Sede Espinar": "SEC-ESPINAR",
    "Secretaría de la Sede Yanaoca": "SEC-YANAOCA", "Secretaría de la Sede Andahuaylas": "SEC-ANDAHUAYLAS",
}
SEDE_DE_OFICINA = {"Rectorado": "Rectorado (Secretaría General)", "Secretaría General": "Rectorado (Secretaría General)",
                   "Consejo Universitario": "Rectorado (Secretaría General)",
                   "Dirección de la Escuela de Posgrado": "Paraninfo Universitario"}

oficinas = {}  # nombre -> dict


def oficina(nombre_crudo: str, sede_nombre: str | None = None) -> int:
    nombre_crudo = re.sub(r"\s+", " ", nombre_crudo).strip()
    nombre = NORMALIZAR.get(plano(nombre_crudo), nombre_crudo)
    if nombre not in oficinas:
        sede = sede_nombre or SEDE_DE_OFICINA.get(nombre, "Ciudad Universitaria")
        oficinas[nombre] = {"id": len(oficinas) + 1, "nombre": nombre,
                            "sigla": SIGLAS.get(nombre) or re.sub(r"[^A-Z]", "", nombre.upper())[:12],
                            "id_sede": SEDE_ID[plano(sede)]}
    return oficinas[nombre]["id"]


# las oficinas "base" primero, para que los ids sean estables
for base in ("Unidad de Trámite Documentario", "Mesa de Partes de la Facultad", "Decanato de la Facultad",
             "Rectorado", "Centro de Cómputo", "Dirección del Centro de Cómputo", "Consejo Universitario"):
    oficina(base)

categorias = {}
procedimientos = []
for n, f in enumerate(fichas, start=1):
    cat = f["categoria"]
    categorias.setdefault(cat, len(categorias) + 1)
    pres = []
    for p in f["presentacion"]:
        nombre, _, sede = p.partition(" : ")
        pres.append(oficina(nombre, sede.strip() or None))
    resp = oficina(f["responsable"]) if f["responsable"] else pres[0]
    for r in f["recursos"]:
        oficina("Consejo Universitario") if "Consejo Universitario" in r["autoridad"] else None
    procedimientos.append({**f, "id": n, "id_categoria": categorias[cat], "oficinas_presentacion": pres,
                           "id_responsable": resp})


def q(v):
    if v is None:
        return "NULL"
    return "'" + str(v).replace("\\", "\\\\").replace("'", "''") + "'"


# ---- SQL ----------------------------------------------------------------------
sql = ["-- =============================================================",
       f"-- Catálogo completo del TUPA UNSAAC ({len(fichas)} fichas) - GENERADO por herramientas/generar_catalogo.py",
       "-- Fuente: TUPA modificado y publicado según Resolución CU-547-2025-UNSAAC",
       "-- No editar a mano: modificar el extractor o el JSON y regenerar.",
       "-- =============================================================",
       "USE tupa_unsaac;", "SET NAMES utf8mb4;", ""]

sql.append("INSERT INTO categorias (id_categoria, nombre) VALUES")
sql.append(",\n".join(f" ({i}, {q(c)})" for c, i in categorias.items()) + ";\n")

sql.append("INSERT INTO oficinas (id_oficina, id_sede, nombre, sigla) VALUES")
sql.append(",\n".join(f" ({o['id']}, {o['id_sede']}, {q(o['nombre'])}, {q(o['sigla'])})"
                      for o in oficinas.values()) + ";\n")

sql.append("INSERT INTO procedimientos (id_procedimiento, codigo, id_categoria, seccion, denominacion, descripcion, "
           "canal_atencion, modalidad_pago, plazo_dias_habiles, calificacion, id_oficina_presentacion, "
           "id_oficina_responsable, notas) VALUES")
sql.append(",\n".join(
    f" ({p['id']}, {q(p['codigo'])}, {p['id_categoria']}, {q(p['seccion'])}, {q(p['denominacion'])}, "
    f"{q(p['descripcion'])}, {q(p['canal_atencion'] or None) if p['canal_atencion'] else 'DEFAULT'}, "
    f"{q(p['modalidad_pago'])}, {p['plazo_dias_habiles']}, {q(p['calificacion'])}, "
    f"{p['oficinas_presentacion'][0]}, {p['id_responsable']}, {q(p['notas'] or None)})"
    for p in procedimientos) + ";\n")

sql.append("INSERT INTO procedimiento_presentacion (id_procedimiento, id_oficina) VALUES")
sql.append(",\n".join(f" ({p['id']}, {o})" for p in procedimientos for o in dict.fromkeys(p["oficinas_presentacion"])) + ";\n")

sql.append("INSERT INTO tarifas_procedimiento (id_procedimiento, concepto, monto) VALUES")
sql.append(",\n".join(f" ({p['id']}, {q(t['concepto'].strip())}, {t['monto']:.2f})"
                      for p in procedimientos for t in p["tarifas"]) + ";\n")

sql.append("INSERT INTO requisitos_procedimiento (id_procedimiento, orden, descripcion, tipo) VALUES")
sql.append(",\n".join(f" ({p['id']}, {r['orden']}, {q(r['descripcion'])}, {q(r['tipo'])})"
                      for p in procedimientos for r in p["requisitos"]) + ";\n")

sql.append("INSERT INTO recursos_procedimiento (id_procedimiento, tipo, autoridad, plazo_presentacion_dias, plazo_respuesta_dias) VALUES")
sql.append(",\n".join(f" ({p['id']}, {q(r['tipo'])}, {q(r['autoridad'])}, {r['plazo_presentacion']}, {r['plazo_respuesta']})"
                      for p in procedimientos for r in p["recursos"]) + ";\n")

(repo / "database" / "03_catalogo_tupa.sql").write_text("\n".join(sql), encoding="utf-8")

# ---- JS para las interfaces ---------------------------------------------------
datos = {
    "sedes": [{"id": i + 1, "nombre": n, "direccion": d, "horario": h, "filial": bool(fl)}
              for i, (n, d, h, fl) in enumerate(SEDES)],
    "oficinas": list(oficinas.values()),
    "categorias": [{"id": i, "nombre": c} for c, i in categorias.items()],
    "procedimientos": [{
        "id": p["id"], "codigo": p["codigo"], "seccion": p["seccion"], "categoria": p["id_categoria"],
        "denominacion": p["denominacion"], "descripcion": p["descripcion"],
        "requisitos": p["requisitos"], "notas": p["notas"], "canal": p["canal_atencion"],
        "tarifas": [{"concepto": t["concepto"].strip(), "monto": t["monto"]} for t in p["tarifas"]],
        "modalidad": p["modalidad_pago"], "plazo": p["plazo_dias_habiles"], "calificacion": p["calificacion"],
        "presentacion": list(dict.fromkeys(p["oficinas_presentacion"])), "responsable": p["id_responsable"],
        "recursos": p["recursos"],
    } for p in procedimientos],
}
js = ("// GENERADO por database/herramientas/generar_catalogo.py a partir del TUPA UNSAAC (CU-547-2025-UNSAAC).\n"
      "// No editar a mano.\n"
      "window.TUPA = " + json.dumps(datos, ensure_ascii=False, separators=(",", ":")) + ";\n")
(repo / "web" / "js").mkdir(parents=True, exist_ok=True)
(repo / "web" / "js" / "datos-tupa.js").write_text(js, encoding="utf-8")

print(f"{len(procedimientos)} procedimientos, {len(oficinas)} oficinas, {len(categorias)} categorías")
print("SQL:", (repo / 'database' / '03_catalogo_tupa.sql').stat().st_size // 1024, "KB | JS:",
      (repo / 'web' / 'js' / 'datos-tupa.js').stat().st_size // 1024, "KB")
