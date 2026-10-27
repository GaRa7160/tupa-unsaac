/* Bandeja de trámites para mesa de partes, oficinas y administrador */
App.montar({ pagina: "panel-oficina", titulo: "Bandeja de trámites", roles: ["MESA_PARTES", "OFICINA", "ADMINISTRADOR"] }, (main, u) => {
  const { esc, plano, $, fmtFecha } = App;
  const todos = App.tramitesVisibles(u);
  main.innerHTML = `<div class="cabecera-pagina"><div><h1>${u.rol === "OFICINA" ? "Bandeja de la oficina" : u.rol === "ADMINISTRADOR" ? "Todos los trámites" : "Bandeja de trámites"}</h1><p>${u.oficina ? esc(App.oficina(u.oficina).nombre) : "Vista general"}</p></div></div>
  <div class="kpis" id="kp"></div>
  <div class="filtros"><div class="campo"><label for="q">Buscar</label><input id="q" type="search" placeholder="Expediente, trámite o solicitante"></div>
  <div class="campo"><label for="est">Estado</label><select id="est"><option value="">Todos</option>${App.estados.map((e) => `<option value="${e.id}">${esc(e.nombre)}</option>`).join("")}</select></div>
  <div class="campo"><label for="ven">Plazo</label><select id="ven"><option value="">Todos</option><option value="v">Vencidos</option><option value="p">Por vencer (1 día)</option></select></div></div>
  <div class="panel" style="padding:0"><div class="tabla-envoltura"><table class="tabla-resp"><thead><tr><th>Expediente</th><th>Trámite</th><th>Solicitante</th><th>Estado</th><th>Oficina</th><th>Plazo</th><th></th></tr></thead><tbody id="tb"></tbody></table></div></div>`;
  const kp = (n, t, c) => `<div class="kpi" style="--c:${c}"><b>${n}</b><span>${t}</span></div>`;
  const ab = todos.filter((t) => t.estado < 7);
  $("#kp").innerHTML = kp(ab.length, "en curso", "#2563EB") + kp(ab.filter((t) => t.estado <= 3).length, "por revisar", "#D97706") + kp(ab.filter((t) => t.estado === 4).length, "observados", "#DC2626") + kp(ab.filter((t) => App.habilesHasta(t.limite) < 0).length, "con plazo vencido", "#7A1424");
  const pintar = () => {
    const q = plano($("#q").value), e = $("#est").value, v = $("#ven").value;
    const l = todos.filter((t) => {
      const us = App.usuario(t.usr), p = App.procedimiento(t.proc), d = App.habilesHasta(t.limite);
      if (e && t.estado !== Number(e)) return false;
      if (v === "v" && !(t.estado < 7 && d < 0)) return false;
      if (v === "p" && !(t.estado < 7 && d >= 0 && d <= 1)) return false;
      return plano(t.exp + " " + p.denominacion + " " + App.nombreUsuario(us)).includes(q);
    });
    $("#tb").innerHTML = l.length ? l.map((t) => { const p = App.procedimiento(t.proc), pl = App.plazoTexto(t);
      return `<tr><td data-label="Expediente"><b>${t.exp}</b></td><td data-label="Trámite">${esc(p.denominacion)}</td><td data-label="Solicitante">${esc(App.nombreUsuario(App.usuario(t.usr)))}</td><td data-label="Estado">${App.insigniaEstado(t.estado)}</td><td data-label="Oficina">${esc(App.oficina(t.oficina).sigla)}</td><td data-label="Plazo"><span class="${pl.clase ? "etiqueta " + pl.clase : ""}">${esc(pl.texto)}</span></td><td><a class="btn btn-sec btn-chico" href="tramite.html?exp=${t.exp}">Abrir</a></td></tr>`; }).join("")
      : `<tr><td colspan="7"><div class="vacio"><strong>No hay trámites con esos filtros</strong>Cuando lleguen nuevos trámites aparecerán aquí.</div></td></tr>`;
  };
  ["q", "est", "ven"].forEach((id) => $("#" + id).addEventListener("input", pintar)); pintar();
});
