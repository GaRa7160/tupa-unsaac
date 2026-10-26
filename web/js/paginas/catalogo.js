/* Consulta del TUPA: búsqueda y filtros */
App.montar({ pagina: "catalogo", titulo: "Consultar el TUPA", publica: true }, (main) => {
  const { esc, plano, $, fmtMonto } = App;
  const todos = App.procedimientos();
  const prm = new URLSearchParams(location.search);
  main.innerHTML = `
  <div class="cabecera-pagina"><div><h1>Consultar el TUPA</h1><p>Requisitos, costos y plazos de ${todos.length} procedimientos y servicios de la UNSAAC.</p></div></div>
  <form class="buscador" role="search" id="b"><label class="sr-only" for="q">Buscar procedimiento</label><input id="q" type="search" placeholder="Ej.: constancia de estudios, matrícula, carné" value="${esc(prm.get("q") || "")}"><button class="btn btn-primario" type="submit">Buscar</button></form>
  <div class="filtros">
    <div class="campo"><label for="cat">Categoría</label><select id="cat"><option value="">Todas</option>${App.categorias.map((c) => `<option value="${c.id}">${esc(c.nombre)}</option>`).join("")}</select></div>
    <div class="campo"><label for="tipo">Tipo</label><select id="tipo"><option value="">Procedimientos y servicios</option><option value="admin">Procedimientos administrativos</option><option value="serv">Servicios exclusivos</option></select></div>
    <div class="campo"><label for="costo">Costo</label><select id="costo"><option value="">Cualquiera</option><option value="gratis">Gratuitos</option><option value="pago">Con pago</option></select></div>
    <div class="campo"><label for="orden">Ordenar por</label><select id="orden"><option value="cod">Código</option><option value="nom">Nombre</option><option value="plazo">Plazo (menor primero)</option><option value="costo">Costo (menor primero)</option></select></div>
  </div>
  <p id="cuenta" class="menor suave" aria-live="polite"></p><ul class="lista-tupa" id="lista"></ul>`;
  const minimo = (p) => (p.tarifas.length ? Math.min(...p.tarifas.map((t) => t.monto)) : 0);
  const pintar = () => {
    const q = plano($("#q").value).split(/\s+/).filter(Boolean);
    let l = todos.filter((p) => {
      const t = plano(p.denominacion + " " + p.descripcion + " " + p.codigo);
      if (!q.every((w) => t.includes(w))) return false;
      if ($("#cat").value && p.categoria !== Number($("#cat").value)) return false;
      if ($("#tipo").value === "admin" && !/administrativo/i.test(p.seccion)) return false;
      if ($("#tipo").value === "serv" && !/servicio/i.test(p.seccion)) return false;
      if ($("#costo").value === "gratis" && minimo(p) > 0) return false;
      if ($("#costo").value === "pago" && minimo(p) === 0 && !p.tarifas.some((t) => t.monto > 0)) return false;
      return true;
    });
    const o = $("#orden").value;
    l.sort((a, b) => o === "nom" ? a.denominacion.localeCompare(b.denominacion, "es") : o === "plazo" ? a.plazo - b.plazo : o === "costo" ? minimo(a) - minimo(b) : a.codigo.localeCompare(b.codigo, "es", { numeric: true }));
    $("#cuenta").textContent = `${l.length} resultado${l.length === 1 ? "" : "s"}`;
    $("#lista").innerHTML = l.length ? l.map((p) => `<li><div><h3><a href="procedimiento.html?id=${p.id}">${esc(p.denominacion)}</a></h3>
      <div class="meta"><span class="etiqueta">${esc(App.categoriaPorId[p.categoria]?.nombre || "")}</span> <span class="menor suave">${esc(p.codigo)}</span></div></div>
      <div class="dato-clave"><b>${esc(App.costoTexto(p))}</b><span>Costo</span></div><div class="dato-clave"><b>${p.plazo} día${p.plazo === 1 ? "" : "s"}</b><span>hábil${p.plazo === 1 ? "" : "es"}</span></div></li>`).join("")
      : `<li><div class="vacio" style="grid-column:1/-1"><strong>No encontramos procedimientos con esos datos</strong>Prueba con otra palabra o quita algún filtro.</div></li>`;
  };
  $("#b").addEventListener("submit", (e) => { e.preventDefault(); pintar(); });
  ["q", "cat", "tipo", "costo", "orden"].forEach((id) => $("#" + id).addEventListener("input", pintar));
  pintar();
});
