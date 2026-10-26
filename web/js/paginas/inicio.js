/* Inicio: panel según el rol */
App.montar({ pagina: "inicio", titulo: "Inicio" }, (main, u) => {
  const { esc, fmtFecha, $ } = App;
  const mios = App.tramitesVisibles(u);
  const abiertos = mios.filter((t) => t.estado < 7);
  const venc = abiertos.filter((t) => App.habilesHasta(t.limite) < 0);
  const kpi = (n, t, c) => `<div class="kpi" style="--c:${c || "var(--granate)"}"><b>${n}</b><span>${t}</span></div>`;
  const fila = (t) => { const p = App.procedimiento(t.proc); return `<tr><td data-label="Expediente"><a href="tramite.html?exp=${t.exp}">${t.exp}</a></td><td data-label="Procedimiento">${esc(p.denominacion)}</td><td data-label="Estado">${App.insigniaEstado(t.estado)}</td><td data-label="Registro">${fmtFecha(t.registro)}</td></tr>`; };
  const tabla = (l) => l.length ? `<div class="tabla-envoltura"><table class="tabla-resp"><thead><tr><th>Expediente</th><th>Procedimiento</th><th>Estado</th><th>Registro</th></tr></thead><tbody>${l.slice(0, 6).map(fila).join("")}</tbody></table></div>` : `<div class="vacio"><strong>Aún no hay trámites</strong>Cuando registres uno, aparecerá aquí.</div>`;
  let cuerpo = "";
  if (u.rol === "ADMINISTRADO") {
    const obs = abiertos.filter((t) => t.estado === 4).length, pagar = abiertos.filter((t) => t.estado === 2).length;
    cuerpo = `<div class="kpis">${kpi(abiertos.length, "trámites en curso")}${kpi(obs, "observados: requieren tu atención", "#DC2626")}${kpi(pagar, "pendientes de pago", "#D97706")}${kpi(mios.filter((t) => t.estado >= 7).length, "resueltos", "#16A34A")}</div>
      ${obs ? `<div class="aviso-caja error" role="alert"><p><b>Tienes ${obs} trámite${obs > 1 ? "s" : ""} observado${obs > 1 ? "s" : ""}.</b> Corrige lo indicado para que la oficina continúe la atención.</p></div>` : ""}
      <div class="panel"><div class="fila entre"><h2>Mis últimos trámites</h2><a class="btn btn-sec btn-chico" href="mis-tramites.html">Ver todos</a></div>${tabla(mios)}</div>
      <div class="panel"><h2>¿Qué necesitas hacer?</h2><div class="fila"><a class="btn btn-primario" href="nuevo-tramite.html">Registrar un trámite</a><a class="btn btn-sec" href="catalogo.html">Revisar requisitos y costos</a><a class="btn btn-sec" href="seguimiento.html">Seguir un expediente</a></div></div>`;
  } else if (u.rol === "ADMINISTRADOR") {
    const e = App.estadisticas(mios);
    cuerpo = `<div class="kpis">${kpi(mios.length, "trámites registrados")}${kpi(abiertos.length, "en curso", "#2563EB")}${kpi(venc.length, "con plazo vencido", "#DC2626")}${kpi(App.procedimientos().length, "procedimientos vigentes", "#16A34A")}</div>
      <div class="panel"><h2>Atajos</h2><div class="fila"><a class="btn btn-primario" href="reportes.html">Ver reportes</a><a class="btn btn-sec" href="admin.html">Mantenimiento del catálogo</a><a class="btn btn-sec" href="panel-oficina.html">Todos los trámites</a></div></div>
      <div class="panel"><h2>Trámites más recientes</h2>${tabla(mios)}</div>`;
  } else {
    const nuevos = abiertos.filter((t) => t.estado <= 3).length;
    cuerpo = `<div class="kpis">${kpi(abiertos.length, "trámites en tu bandeja")}${kpi(nuevos, "por revisar", "#2563EB")}${kpi(venc.length, "con plazo vencido", "#DC2626")}${kpi(mios.filter((t) => t.estado >= 7).length, "atendidos", "#16A34A")}</div>
      ${venc.length ? `<div class="aviso-caja aviso"><p><b>${venc.length} trámite${venc.length > 1 ? "s" : ""} superó${venc.length > 1 ? "ron" : ""} el plazo del TUPA.</b> Dales prioridad.</p></div>` : ""}
      <div class="panel"><div class="fila entre"><h2>Bandeja reciente</h2><a class="btn btn-primario btn-chico" href="panel-oficina.html">Abrir bandeja</a></div>${tabla(abiertos)}</div>`;
  }
  main.innerHTML = `<div class="cabecera-pagina"><div><h1>Hola, ${esc(u.nombres)}</h1><p>${esc(App.DEMO.roles[u.rol])}${u.oficina ? " · " + esc(App.oficina(u.oficina).nombre) : ""}</p></div></div>${cuerpo}`;
});
