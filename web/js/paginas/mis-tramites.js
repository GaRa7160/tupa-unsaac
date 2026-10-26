/* Lista de trámites del administrado */
App.montar({ pagina: "mis-tramites", titulo: "Mis trámites", roles: ["ADMINISTRADO"] }, (main, u) => {
  const { esc, plano, $, fmtFecha } = App;
  const todos = App.tramitesVisibles(u);
  main.innerHTML = `<div class="cabecera-pagina"><div><h1>Mis trámites</h1><p>${todos.length} en total</p></div><a class="btn btn-primario" href="nuevo-tramite.html">Registrar un trámite</a></div>
  <div class="filtros"><div class="campo"><label for="q">Buscar</label><input id="q" type="search" placeholder="Expediente o nombre del trámite"></div>
  <div class="campo"><label for="est">Estado</label><select id="est"><option value="">Todos</option>${App.estados.map((e) => `<option value="${e.id}">${esc(e.nombre)}</option>`).join("")}</select></div></div>
  <div class="panel" style="padding:0"><div class="tabla-envoltura"><table class="tabla-resp"><thead><tr><th>Expediente</th><th>Trámite</th><th>Estado</th><th>Avance</th><th>Plazo</th><th>Registro</th></tr></thead><tbody id="tb"></tbody></table></div></div>`;
  const pintar = () => {
    const q = plano($("#q").value), e = $("#est").value;
    const l = todos.filter((t) => (!e || t.estado === Number(e)) && plano(t.exp + " " + App.procedimiento(t.proc).denominacion + " " + t.asunto).includes(q));
    $("#tb").innerHTML = l.length ? l.map((t) => { const p = App.procedimiento(t.proc), pl = App.plazoTexto(t);
      return `<tr><td data-label="Expediente"><a href="tramite.html?exp=${t.exp}"><b>${t.exp}</b></a></td><td data-label="Trámite">${esc(p.denominacion)}<br><span class="menor suave">${esc(t.asunto)}</span></td><td data-label="Estado">${App.insigniaEstado(t.estado)}</td><td data-label="Avance">${App.etapas(t)}</td><td data-label="Plazo"><span class="${pl.clase ? "etiqueta " + pl.clase : ""}">${esc(pl.texto)}</span></td><td data-label="Registro">${fmtFecha(t.registro)}</td></tr>`; }).join("")
      : `<tr><td colspan="6"><div class="vacio"><strong>No hay trámites con esos filtros</strong>Quita algún filtro o registra un trámite nuevo.</div></td></tr>`;
  };
  $("#q").addEventListener("input", pintar); $("#est").addEventListener("change", pintar); pintar();
});
