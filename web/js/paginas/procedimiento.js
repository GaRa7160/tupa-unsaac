/* Ficha de un procedimiento del TUPA */
App.montar({ pagina: "catalogo", titulo: "Procedimiento", publica: true }, (main, u) => {
  const { esc, fmtMonto } = App;
  const p = App.procedimiento(new URLSearchParams(location.search).get("id"));
  if (!p) { main.innerHTML = `<div class="vacio"><strong>No existe ese procedimiento</strong><a href="catalogo.html">Volver al catálogo</a></div>`; return; }
  document.title = p.denominacion + " · Trámites UNSAAC";
  const ico = { DOCUMENTO: "D", PAGO: "S/", CONDICION: "✓" }, nom = { DOCUMENTO: "Documento", PAGO: "Pago", CONDICION: "Condición" };
  const sedes = p.presentacion.map((id) => { const o = App.oficina(id); const s = App.sedes.find((x) => x.id === o.id_sede); return `<li><b>${esc(o.nombre)}</b><br><span class="menor suave">${esc(s.nombre)} · ${esc(s.direccion)} · ${esc(s.horario)}</span></li>`; }).join("");
  const silencio = p.calificacion;
  const accion = !u ? `<a class="btn btn-primario" href="index.html?siguiente=${encodeURIComponent("nuevo-tramite.html?proc=" + p.id)}">Ingresar para registrar este trámite</a>`
    : u.rol === "ADMINISTRADO" ? `<a class="btn btn-primario" href="nuevo-tramite.html?proc=${p.id}">Iniciar este trámite</a>` : "";
  main.innerHTML = `
  <p class="migas"><a href="catalogo.html">Consultar el TUPA</a><span aria-hidden="true">/</span>${esc(App.categoriaPorId[p.categoria]?.nombre || "")}</p>
  <div class="cabecera-pagina"><div><h1>${esc(p.denominacion)}</h1><p>${esc(p.codigo)} · ${esc(p.seccion)}</p></div>${accion}</div>
  <div class="hechos">
    <div class="hecho"><b>${esc(App.costoTexto(p))}</b><span>Costo</span></div>
    <div class="hecho"><b>${p.plazo} día${p.plazo === 1 ? "" : "s"} hábil${p.plazo === 1 ? "" : "es"}</b><span>Plazo de atención</span></div>
    <div class="hecho"><b style="font-size:1.1rem">${esc(silencio)}</b><span>Calificación</span></div>
    <div class="hecho"><b style="font-size:1.1rem">${esc(p.modalidad || "—")}</b><span>Modalidad de pago</span></div>
  </div>
  <div class="rejilla lateral">
   <div class="pila">
    <section class="panel"><h2>Qué es</h2><p>${esc(p.descripcion || "Sin descripción en el TUPA.")}</p></section>
    <section class="panel"><h2>Requisitos</h2>${p.requisitos.length ? `<ol class="lista-req">${p.requisitos.map((r) => `<li><span class="ico" aria-hidden="true">${ico[r.tipo] || "•"}</span><span class="texto">${esc(r.descripcion)}<br><span class="etiqueta ${r.tipo === "PAGO" ? "aviso" : r.tipo === "CONDICION" ? "info" : ""}">${nom[r.tipo] || r.tipo}</span></span></li>`).join("")}</ol>` : "<p>No tiene requisitos.</p>"}
      ${p.notas ? `<div class="aviso-caja"><p>${esc(p.notas)}</p></div>` : ""}</section>
    ${p.tarifas.length ? `<section class="panel"><h2>Costos</h2><div class="tabla-envoltura"><table class="tabla-resp"><thead><tr><th>Concepto</th><th class="num">Monto</th></tr></thead><tbody>${p.tarifas.map((t) => `<tr><td data-label="Concepto">${esc(t.concepto)}</td><td class="num" data-label="Monto">${fmtMonto(t.monto)}</td></tr>`).join("")}</tbody></table></div></section>` : ""}
    ${p.recursos.length ? `<section class="panel"><h2>Si no estás de acuerdo con la respuesta</h2><div class="tabla-envoltura"><table class="tabla-resp"><thead><tr><th>Recurso</th><th>Autoridad que resuelve</th><th class="num">Presentar en</th><th class="num">Respuesta en</th></tr></thead><tbody>${p.recursos.map((r) => `<tr><td data-label="Recurso">${esc(r.tipo)}</td><td data-label="Autoridad">${esc(r.autoridad)}</td><td class="num" data-label="Presentar en">${r.plazo_presentacion} días hábiles</td><td class="num" data-label="Respuesta en">${r.plazo_respuesta} días hábiles</td></tr>`).join("")}</tbody></table></div></section>` : ""}
   </div>
   <aside class="pila">
    <section class="panel"><h3>Dónde se presenta</h3><ul style="padding-left:1.1rem">${sedes}</ul></section>
    <section class="panel"><h3>Quién lo resuelve</h3><p>${esc(App.oficina(p.responsable)?.nombre || "—")}</p>${p.canal ? `<h3>Canal de atención</h3><p>${esc(p.canal)}</p>` : ""}</section>
   </aside>
  </div>`;
});
