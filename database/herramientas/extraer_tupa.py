#!/usr/bin/env python3
"""Extrae las fichas del TUPA de la UNSAAC (PDF con capa de texto) a JSON.

Uso:  python3 -I extraer_tupa.py  TUPA.pdf  salida.json
Requiere: `pdftotext` (poppler-utils).
"""
import json
import re
import subprocess
import sys
import unicodedata
from pathlib import Path

pdf, salida = Path(sys.argv[1]), Path(sys.argv[2])
texto = subprocess.run(["pdftotext", "-layout", str(pdf), "-"], check=True, capture_output=True, text=True).stdout

# ---- limpieza de cabeceras y pies de página --------------------------------
RUIDO = (re.compile(r"^\s*Texto Único de Procedimientos Administrativos\s*$"),
         re.compile(r'^\s*"UNIVERSIDAD NACIONAL DE SAN ANTONIO ABAD DEL CUSCO"\s*$'),
         re.compile(r"^\s*pág\.\s*\d+\s*$"),
         re.compile(r"\f"))
lineas = []
for l in texto.split("\n"):
    l = l.replace("\f", "")
    if any(r.search(l) for r in RUIDO[:3]):
        continue
    lineas.append(l.rstrip())

fin = next((i for i, l in enumerate(lineas) if re.match(r"\s*SECCIÓN N° 3", l) and i > 500), len(lineas))
lineas = lineas[:fin]

# ---- separar en fichas -------------------------------------------------------
INICIO = re.compile(r"^\s*Denominación del (Procedimiento Administrativo|Servicio)\s*$")
indices = [i for i, l in enumerate(lineas) if INICIO.match(l)]
bloques = []
for n, i in enumerate(indices):
    j = indices[n + 1] if n + 1 < len(indices) else len(lineas)
    bloques.append(lineas[i:j])


def izq(l: str) -> str:
    """Texto de la columna izquierda de una línea a dos columnas."""
    return re.split(r"\s{3,}", l.strip())[0].strip()


def seccion(bloque, ini_pat, fin_pats):
    """Líneas entre un encabezado y el siguiente de la lista."""
    ini = next((k for k, l in enumerate(bloque) if re.search(ini_pat, l, re.I)), None)
    if ini is None:
        return []
    fin = len(bloque)
    for k in range(ini + 1, len(bloque)):
        if any(re.search(p, bloque[k], re.I) for p in fin_pats):
            fin = k
            break
    return bloque[ini + 1:fin]


def limpiar(partes):
    return re.sub(r"\s+", " ", " ".join(p.strip() for p in partes if p.strip())).strip()


def tipo_requisito(texto_req: str) -> str:
    t = texto_req.lower()
    if re.match(r"^pago|^abonar|^recibo de pago", t) or "pago por derecho" in t[:40]:
        return "PAGO"
    if re.search(r"no ser deudor|figurar en el sistema|ser alumno|interposici[oó]n dentro|sustentar recurso|estar matriculado|no tener", t[:90]):
        return "CONDICION"
    return "DOCUMENTO"


CATEGORIAS = [
    (r"recurso de (reconsideraci|apelaci)", "Recursos administrativos"),
    (r"admisi[oó]n|cepru|constancia de ingreso|carn[eé] de postulante|ads\.", "Admisión"),
    (r"residentado|segunda especialidad|segunda especializaci", "Segunda especialidad y residentado"),
    (r"maestr[ií]a|doctorad|escuela de posgrado|posgrado", "Posgrado"),
    (r"traslado|convalidaci|homologaci", "Traslados, convalidación y homologación"),
    (r"matr[ií]cula|reinicio|reserva|cursos dirigidos|subsanaci", "Matrícula y reinicio de estudios"),
    (r"carn[eé]|biblioteca|visitantes|pase para escolares", "Carné y biblioteca"),
    (r"t[ií]tulo|grado|diploma|bachiller|tesis|dictamen|r[eé]valida|jurament|sustentaci|rotulado|anotaci[oó]n marginal|suficiencia|servicios a nivel", "Grados, títulos y tesis"),
    (r"pensi[oó]n|fallecimiento|sepelio|cese|renuncia|decreto ley|subsidio|orfandad|incorporaci", "Personal y pensiones"),
    (r"constancia|certificad|carta|acta|ficha|s[ií]labo|copia|rectificaci|duplicado|buena conducta|tercio|no ser deudor", "Certificados y constancias"),
]


def categoria_de(denominacion: str) -> str:
    t = denominacion.lower()
    for patron, cat in CATEGORIAS:
        if re.search(patron, t):
            return cat
    return "Otros trámites"


fichas = []
for b in bloques:
    es_pa = "Procedimiento Administrativo" in b[0]
    denom = next((re.sub(r'^\s*"|"\s*$', "", l.strip()).strip() for l in b[1:6] if l.strip().startswith('"')), None)
    codigo = next((m.group(1) for l in b[:10] if (m := re.search(r"Código:\s*(\S+)", l))), None)

    descripcion = limpiar(seccion(b, r"^\s*Descripción del (procedimiento|servicio)", [r"^\s*Requisitos\s*$"]))

    req_lineas = seccion(b, r"^\s*Requisitos\s*$", [r"^\s*Notas:", r"^\s*Formularios\s*$"])
    requisitos, actual = [], None
    for l in req_lineas:
        if not l.strip():
            continue
        m = re.match(r"^\s*(\d+)\.-?\s*(.*)$", l)
        if m:
            actual = {"orden": int(m.group(1)), "lineas": [m.group(2).strip()]}
            requisitos.append(actual)
        elif actual:
            actual["lineas"].append(l.strip())
    for r in requisitos:
        r["descripcion"] = "\n".join(x for x in r.pop("lineas") if x)
        r["tipo"] = tipo_requisito(r["descripcion"])

    notas = limpiar(seccion(b, r"^\s*Notas:", [r"^\s*Formularios\s*$"]))

    canal = limpiar(seccion(b, r"^\s*Canales de atención", [r"^\s*Pago por derecho"]))

    # Tarifas
    pago_lineas = seccion(b, r"^\s*Pago por derecho de tramitación", [r"^\s*Plazo", r"^\s*Sedes y horarios"])
    tarifas, pendiente = [], []
    for l in pago_lineas:
        if not l.strip():
            continue
        m = re.search(r"Monto\s*-\s*S/\.?\s*([\d,]+(?:\.\d+)?)", l)
        if m:
            concepto = limpiar(pendiente).rstrip(":") or "Derecho de trámite"
            tarifas.append({"concepto": concepto, "monto": float(m.group(1).replace(",", ""))})
            pendiente = []
        elif re.search(r"Gratuito", l, re.I):
            tarifas.append({"concepto": "Gratuito", "monto": 0.0})
            pendiente = []
        else:
            parte = izq(l)
            if parte and not re.match(r"^(Caja de la Entidad|Efectivo|Modalidad)", parte):
                pendiente.append(parte)
    modalidad = "Caja de la Entidad - Efectivo, soles" if any("Caja de la Entidad" in l for l in pago_lineas) else None

    plazo_txt = limpiar(seccion(b, r"^\s*Plazo( de atención)?\b", [r"^\s*Sedes y horarios"]))
    m = re.search(r"(\d+)\s*d[ií]as?\s*h[aá]biles", plazo_txt, re.I)
    plazo = int(m.group(1)) if m else None
    if re.search(r"Silencio Administrativo Positivo", plazo_txt, re.I):
        calif = "SILENCIO_POSITIVO"
    elif re.search(r"Silencio Administrativo Negativo", plazo_txt, re.I):
        calif = "SILENCIO_NEGATIVO"
    else:
        calif = "NO_APLICA"

    presentacion = [re.sub(r"\s+", " ", l.strip()) for l in
                    seccion(b, r"^\s*Unidad de organización donde se presenta", [r"^\s*Unidad de organización responsable"])
                    if l.strip()]

    resp_lineas = seccion(b, r"^\s*Unidad de organización responsable", [r"^\s*Instancias de resolución", r"^\s*Base legal"])
    resp = next((izq(l) for l in resp_lineas if l.strip()), None)

    # Recursos (reconsideración / apelación). El bloque puede quedar partido por el salto de página.
    rec_txt = "\n".join(seccion(b, r"^\s*Instancias de resolución", [r"^\s*Base legal"]))
    recursos = []
    m_aut = re.search(r"Autoridad competente\s+Ante (.+?)\s{3,}Ante (.+)", rec_txt)
    plazos = re.findall(r"(\d+) días hábiles\s+(\d+) días hábiles", rec_txt)
    if m_aut and len(plazos) >= 2:
        recursos = [
            {"tipo": "RECONSIDERACION", "autoridad": m_aut.group(1).strip(),
             "plazo_presentacion": int(plazos[0][0]), "plazo_respuesta": int(plazos[1][0])},
            {"tipo": "APELACION", "autoridad": m_aut.group(2).strip(),
             "plazo_presentacion": int(plazos[0][1]), "plazo_respuesta": int(plazos[1][1])},
        ]

    fichas.append({
        "codigo": codigo, "seccion": "PROCEDIMIENTO_ADMINISTRATIVO" if es_pa else "SERVICIO_EXCLUSIVO",
        "denominacion": denom, "categoria": categoria_de(denom or ""),
        "descripcion": descripcion, "requisitos": requisitos, "notas": notas, "canal_atencion": canal,
        "tarifas": tarifas, "modalidad_pago": modalidad if any(t["monto"] > 0 for t in tarifas) else None,
        "plazo_dias_habiles": plazo, "calificacion": calif,
        "presentacion": presentacion, "responsable": resp, "recursos": recursos,
    })

salida.write_text(json.dumps(fichas, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"{len(fichas)} fichas -> {salida}")
