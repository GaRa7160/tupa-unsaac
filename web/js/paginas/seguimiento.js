/* Seguimiento de un expediente (consulta pública, sin datos personales) */
App.montar({ pagina: "seguimiento", titulo: "Seguimiento", publica: true }, (main) => {
  const { esc, $, fmtFechaHora, fmtFecha } = App;
  const exp0 = new URLSearchParams(location.search).get("exp") || "";
  main.innerHTML = `<div class="cabecera-pagina"><div><h1>Seguimiento de expediente</h1><p>Escribe el número que recibiste al registrar tu trámite. Ejemplo: ${new Date().getFullYear()}-000002</p></div></div>
    <form class="buscador" id="b" novalidate><label class="sr-only" for="exp">Número de expediente</label><input id="exp" value="${esc(exp0)}" placeholder="AAAA-NNNNNN" inputmode="numeric" autocomplete="off"><button class="btn btn-primario" type="submit">Consultar</button></form>
    <div id="res" style="margin-top:1.25rem" aria-live="polite"></div>`;
  function ver() {
    const exp = $("#exp").value.trim(), r = $("#res");
    if (!/^\d{4}-\d{6}$/.test(exp)) { r.innerHTML = `<div class="aviso-caja error" role="alert"><p>El número debe tener el formato AAAA-NNNNNN (año, guion y 6 dígitos).</p></div>`; return; }
    const t = App.tramitePorExp(exp);
    if (!t) { r.innerHTML = `<div class="aviso-caja error" role="alert"><p>No encontramos el expediente <b>${esc(exp)}</b>. Revisa el número o consulta en Mesa de Partes.</p></div>`; return; }
    const p = App.procedimiento(t.proc), pl = App.plazoTexto(t);
    const paradas = t.hist.map((h, i) => { const ult = i === t.hist.length - 1 && t.estado < 7;
      return `<li class="${ult ? "actual" : ""}"><span class="parada"></span><h3>${esc(App.estadoPorId[h.estado].nombre)}</h3><div class="donde">${fmtFechaHora(h.fecha)} · ${esc(App.oficina(h.destino).nombre)}</div></li>`; }).join("");
    r.innerHTML = `<div class="panel"><div class="fila entre"><div><h2 style="margin:0">${esc(p.denominacion)}</h2><span class="menor suave">Expediente ${esc(t.exp)} · registrado el ${fmtFecha(t.registro)}</span></div>${App.insigniaEstado(t.estado)}</div>
      <div class="hechos"><div class="hecho"><b style="font-size:1.1rem">${esc(App.oficina(t.oficina).nombre)}</b><span>Oficina actual</span></div><div class="hecho"><b style="font-size:1.1rem">${esc(pl.texto)}</b><span>Plazo del TUPA: ${p.plazo} día${p.plazo === 1 ? "" : "s"} hábil${p.plazo === 1 ? "" : "es"}</span></div></div>
      ${pl.silencio && pl.clase === "error" ? `<div class="aviso-caja aviso"><p>El plazo venció. Si el procedimiento tiene silencio administrativo positivo, puedes presentar el escrito de invocación del silencio.</p></div>` : ""}
      <h3>Ruta del trámite</h3><ol class="ruta">${paradas}${t.estado < 7 ? `<li class="pendiente"><span class="parada"></span><h3>Resolución</h3><div class="donde">Pendiente</div></li>` : ""}</ol></div>
      ${App.usuarioActual() ? `<a class="btn btn-sec" href="tramite.html?exp=${esc(t.exp)}">Ver el detalle completo</a>` : ""}`;
  }
  $("#b").addEventListener("submit", (e) => { e.preventDefault(); history.replaceState(null, "", "?exp=" + encodeURIComponent($("#exp").value.trim())); ver(); });
  if (exp0) ver();
});
