App.montar({ pagina: "notificaciones", titulo: "Notificaciones" }, (main, u) => {
  const { esc, $, fmtFechaHora } = App;
  const S = App.estado;
  function pintar() {
    const l = S.notificaciones.filter((n) => n.usr === u.id);
    main.innerHTML = `<div class="cabecera-pagina"><div><h1>Notificaciones</h1><p>${l.filter((n) => !n.leida).length} sin leer</p></div>${l.some((n) => !n.leida) ? '<button class="btn btn-sec" id="todas">Marcar todas como leídas</button>' : ""}</div>
    <div class="panel">${l.length ? `<ul class="lista-req">${l.map((n) => `<li><span class="ico" aria-hidden="true">${n.leida ? "✓" : "!"}</span><span class="texto"><b>${esc(n.titulo)}</b>${n.leida ? "" : ' <span class="etiqueta aviso">Nueva</span>'}<br>${esc(n.mensaje)}<br><span class="menor suave">${fmtFechaHora(n.fecha)} · <a href="tramite.html?exp=${esc(n.tramite)}" data-n="${n.id}">Ver trámite</a></span></span></li>`).join("")}</ul>` : '<div class="vacio"><strong>No tienes notificaciones</strong>Te avisaremos cuando un trámite cambie de estado.</div>'}</div>`;
    $("#todas")?.addEventListener("click", () => { l.forEach((n) => (n.leida = true)); App.guardar(); location.reload(); });
    App.$$("[data-n]").forEach((a) => a.addEventListener("click", () => { const n = S.notificaciones.find((x) => x.id === Number(a.dataset.n)); if (n) { n.leida = true; App.guardar(); } }));
  }
  pintar();
});
