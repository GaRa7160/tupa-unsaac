/* Detalle de un trámite: ruta, documentos, pago y acciones de la oficina */
App.montar({ pagina: "mis-tramites", titulo: "Detalle del trámite" }, (main, u) => {
  const { esc, $, $$, fmtFecha, fmtFechaHora, fmtMonto, fmtTam } = App;
  const exp = new URLSearchParams(location.search).get("exp");
  const staff = u.rol !== "ADMINISTRADO";
  const nada = (m) => { main.innerHTML = `<div class="vacio"><strong>${m}</strong><a href="${staff ? "panel-oficina" : "mis-tramites"}.html">Volver a la lista</a></div>`; };
  function pintar() {
    const t = App.tramitePorExp(exp);
    if (!t) return nada("No existe ese expediente");
    if (u.rol === "ADMINISTRADO" && t.usr !== u.id) return nada("Este expediente no te pertenece");
    const p = App.procedimiento(t.proc), duenio = App.usuario(t.usr), pl = App.plazoTexto(t);
    const puedeActuar = u.rol === "ADMINISTRADOR" || u.rol === "MESA_PARTES" || (u.rol === "OFICINA" && t.oficina === u.oficina);
    const abierto = t.estado < 7;
    const reqDoc = (o) => p.requisitos.find((r) => r.orden === o);
    const paradas = t.hist.map((h, i) => { const ult = i === t.hist.length - 1 && abierto, quien = App.usuario(h.usr);
      return `<li class="${ult ? "actual" : ""}"><span class="parada"></span><h3>${esc(App.estadoPorId[h.estado].nombre)}</h3><div class="donde">${fmtFechaHora(h.fecha)} · ${esc(App.oficina(h.destino).nombre)}${quien && staff ? " · " + esc(App.nombreUsuario(quien)) : ""}</div>${h.comentario ? `<p class="nota">${esc(h.comentario)}</p>` : ""}</li>`; }).join("");
    const docs = t.docs.map((d) => { const r = reqDoc(d.orden);
      const cls = d.estado === "APROBADO" ? "exito" : d.estado === "OBSERVADO" ? "error" : "aviso";
      const acc = staff && puedeActuar && abierto ? `<div class="fila"><button class="btn btn-chico btn-sec" data-ok="${d.orden}">Aprobar</button><button class="btn btn-chico btn-plano" data-obs="${d.orden}">Observar</button></div>`
        : (!staff && d.estado === "OBSERVADO" ? `<label class="btn btn-chico btn-primario" for="re${d.orden}">Subir corregido</label><input id="re${d.orden}" class="sr-only" type="file" accept=".pdf,.zip,.rar,.docx,.xlsx" data-re="${d.orden}">` : "");
      return `<div class="documento-fila"><div><b>${esc(String(r ? r.descripcion : "Documento").split("\n")[0])}</b><br><span class="menor suave">${esc(d.nombre)} · ${fmtTam(d.tam)} · versión ${d.version}</span>${d.obs ? `<br><span class="menor" style="color:var(--error)">Observación: ${esc(d.obs)}</span>` : ""}</div><div><span class="etiqueta ${cls}">${d.estado === "APROBADO" ? "Aprobado" : d.estado === "OBSERVADO" ? "Observado" : "Por revisar"}</span>${acc}</div></div>`; }).join("");
    let pago = "";
    if (t.pago) {
      const e = t.pago.estado;
      pago = `<section class="panel"><h2>Pago</h2><p>${esc(t.pago.concepto)}: <b>${fmtMonto(t.pago.monto)}</b> · <span class="etiqueta ${e === "VALIDADO" ? "exito" : e === "RECHAZADO" ? "error" : "aviso"}">${e === "VALIDADO" ? "Validado" : e === "RECHAZADO" ? "Rechazado" : t.pago.nroOp ? "Por validar" : "Sin registrar"}</span></p>
        ${t.pago.nroOp ? `<p class="menor suave">Operación ${esc(t.pago.nroOp)}${t.pago.fecha ? " · " + fmtFecha(t.pago.fecha) : ""}</p>` : ""}
        ${!staff && abierto && !t.pago.nroOp ? `<form id="fp" class="form-fila" novalidate><div class="campo"><label for="nro">Número de operación</label><input id="nro" inputmode="numeric"></div><div class="campo"><label for="fpd">Fecha de pago</label><input id="fpd" type="date" max="${new Date().toISOString().slice(0, 10)}"></div><div><button class="btn btn-primario" type="submit">Registrar pago</button></div></form>` : ""}
        ${staff && puedeActuar && abierto && t.pago.nroOp && e === "PENDIENTE" ? `<div class="fila"><button class="btn btn-sec btn-chico" id="pv">Validar pago</button><button class="btn btn-plano btn-chico" id="pr">Rechazar pago</button></div>` : ""}</section>`;
    }
    const sig = (DEMO_T()[t.estado] || []).filter((e) => !(e === 2 && !t.pago));
    const panelAcc = staff && puedeActuar && sig.length ? `<section class="panel no-imprimir"><h2>Actualizar trámite</h2><form id="fa" novalidate>
      <div class="campo"><label for="ne">Nuevo estado</label><select id="ne">${sig.map((e) => `<option value="${e}">${esc(App.estadoPorId[e].nombre)}</option>`).join("")}</select></div>
      <div class="campo" id="cd" hidden><label for="dest">Derivar a</label><select id="dest"><option value="">Elige una oficina</option>${App.oficinas.filter((o) => o.id !== t.oficina).map((o) => `<option value="${o.id}">${esc(o.nombre)}</option>`).join("")}</select></div>
      <div class="campo"><label for="com">Comentario</label><textarea id="com" maxlength="500"></textarea><p class="ayuda">Obligatorio al observar. El administrado lo verá.</p></div>
      <button class="btn btn-primario" type="submit">Guardar cambio</button></form></section>` : "";
    const reenviar = !staff && t.estado === 4 ? `<div class="aviso-caja error"><p><b>Tu trámite fue observado.</b> Sube los documentos corregidos y luego reenvíalo.</p><button class="btn btn-primario btn-chico" id="reenv"${t.docs.some((d) => d.estado === "OBSERVADO") ? " disabled" : ""}>Reenviar a revisión</button></div>` : "";
    main.innerHTML = `<p class="migas"><a href="${staff ? "panel-oficina" : "mis-tramites"}.html">${staff ? "Bandeja" : "Mis trámites"}</a><span aria-hidden="true">/</span>${t.exp}</p>
      <div class="cabecera-pagina"><div><h1>${esc(p.denominacion)}</h1><p>Expediente ${t.exp} · ${esc(t.asunto)}</p></div><div class="fila no-imprimir">${App.insigniaEstado(t.estado)}<button class="btn btn-plano btn-chico" onclick="print()">Imprimir</button></div></div>
      ${reenviar}
      <div class="hechos"><div class="hecho"><b style="font-size:1.1rem">${esc(App.oficina(t.oficina).nombre)}</b><span>Oficina actual</span></div><div class="hecho"><b style="font-size:1.1rem">${esc(pl.texto)}</b><span>Plazo: ${p.plazo} día${p.plazo === 1 ? "" : "s"} hábil${p.plazo === 1 ? "" : "es"} (vence ${fmtFecha(t.limite)})</span></div><div class="hecho"><b style="font-size:1.1rem">${fmtFecha(t.registro)}</b><span>Fecha de registro</span></div></div>
      ${pl.silencio && pl.clase === "error" ? `<div class="aviso-caja aviso"><p>Venció el plazo y el procedimiento tiene <b>silencio administrativo positivo</b>: se considera aprobado si la oficina no respondió.</p></div>` : ""}
      <div class="rejilla lateral"><div class="pila">
        <section class="panel"><h2>Ruta del trámite</h2><ol class="ruta">${paradas}${abierto ? `<li class="pendiente"><span class="parada"></span><h3>Resolución</h3><div class="donde">Pendiente</div></li>` : ""}</ol></section>
        <section class="panel"><h2>Documentos</h2>${docs || '<p class="suave">Este trámite no tiene documentos adjuntos.</p>'}</section>${pago}
      </div><aside class="pila">
        <section class="panel"><h3>Solicitante</h3><p>${esc(App.nombreUsuario(duenio))}<br><span class="menor suave">DNI ${esc(duenio.dni)}${duenio.codigo ? " · Código " + esc(duenio.codigo) : ""}<br>${esc(t.correo)} · ${esc(t.telefono)}</span></p></section>
        ${panelAcc}
      </aside></div>`;
    enlazar(t, p);
  }
  const DEMO_T = () => App.TRANSICIONES;
  function enlazar(t, p) {
    $$("[data-ok]").forEach((b) => b.addEventListener("click", () => { App.validarDocumento(t.exp, b.dataset.ok, "APROBADO", "", u.id); App.toast("Documento aprobado.", "exito"); pintar(); }));
    $$("[data-obs]").forEach((b) => b.addEventListener("click", () => {
      const d = App.dialogo(`<form method="dialog"><h2>Observar documento</h2><div class="campo"><label for="mo">¿Qué debe corregir el administrado?</label><textarea id="mo" required></textarea></div><div class="acciones"><button type="button" class="btn btn-plano" data-cerrar>Cancelar</button><button class="btn btn-primario" value="ok">Observar</button></div></form>`);
      d.querySelector("form").addEventListener("submit", (e) => { const m = d.querySelector("#mo").value.trim(); if (!m) { e.preventDefault(); d.querySelector("#mo").focus(); return; } App.validarDocumento(t.exp, b.dataset.obs, "OBSERVADO", m, u.id); App.toast("Documento observado.", "exito"); pintar(); });
    }));
    $$("[data-re]").forEach((inp) => inp.addEventListener("change", () => {
      const f = inp.files[0]; if (!f) return; const ext = f.name.split(".").pop().toLowerCase();
      if (!["pdf", "zip", "rar", "docx", "xlsx"].includes(ext)) return App.toast("Formato no permitido. Usa PDF, ZIP, RAR, DOCX o XLSX.", "error");
      if (f.size > 50 * 1048576) return App.toast("El archivo supera los 50 MB.", "error");
      App.subirDocumento(t.exp, inp.dataset.re, { nombre: f.name, tam: f.size }); App.toast("Documento corregido subido.", "exito"); pintar();
    }));
    $("#reenv")?.addEventListener("click", () => { const r = App.cambiarEstado(t.exp, 3, { usr: u.id, comentario: "El administrado corrigió las observaciones" }); App.toast(r.ok ? "Reenviado a revisión." : r.mensaje, r.ok ? "exito" : "error"); pintar(); });
    $("#fp")?.addEventListener("submit", (e) => {
      e.preventDefault(); const n = $("#nro").value.trim(), f = $("#fpd").value;
      if (!/^\d{4,12}$/.test(n)) return App.toast("El número de operación tiene entre 4 y 12 dígitos.", "error");
      if (!f) return App.toast("Indica la fecha de pago.", "error");
      App.registrarPago(t.exp, n, new Date(f).toISOString()); App.toast("Pago registrado; la oficina lo validará.", "exito"); pintar();
    });
    $("#pv")?.addEventListener("click", () => { App.validarPago(t.exp, true, u.id); if (t.estado === 2) App.cambiarEstado(t.exp, 3, { usr: u.id, comentario: "Pago validado" }); App.toast("Pago validado.", "exito"); pintar(); });
    $("#pr")?.addEventListener("click", () => { App.validarPago(t.exp, false, u.id); App.toast("Pago rechazado.", "exito"); pintar(); });
    const ne = $("#ne"); if (ne) { const f = () => ($("#cd").hidden = ne.value !== "5"); ne.addEventListener("change", f); f(); }
    $("#fa")?.addEventListener("submit", (e) => {
      e.preventDefault(); const nuevo = Number(ne.value);
      const r = App.cambiarEstado(t.exp, nuevo, { destino: $("#dest").value, usr: u.id, comentario: $("#com").value.trim() });
      App.toast(r.ok ? "Trámite actualizado." : r.mensaje, r.ok ? "exito" : "error"); if (r.ok) pintar(); else (nuevo === 4 ? $("#com") : $("#dest")).focus();
    });
  }
  pintar();
});
