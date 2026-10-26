/* Registro de un trámite en 4 pasos */
App.montar({ pagina: "nuevo-tramite", titulo: "Nuevo trámite", roles: ["ADMINISTRADO"] }, (main, u) => {
  const { esc, plano, $, $$, fmtMonto, fmtTam } = App;
  const EXT = ["pdf", "zip", "rar", "docx", "xlsx"], MAX = 50 * 1024 * 1024;
  const est = { paso: 1, proc: null, asunto: "", telefono: u.telefono || "", correo: u.correo, tarifa: 0, condiciones: {}, archivos: {}, pagoModo: "caja", nroOp: "", fechaPago: "" };
  const inicial = App.procedimiento(new URLSearchParams(location.search).get("proc"));
  if (inicial) est.proc = inicial;
  const todos = App.procedimientos();
  const PASOS = ["Elige el trámite", "Tus datos", "Documentos", "Pago y confirmación"];
  const proc = () => est.proc;
  const primera = (t) => String(t).split("\n")[0];

  function pasos() { return `<ol class="pasos" aria-label="Progreso">${PASOS.map((t, i) => `<li${i + 1 === est.paso ? ' aria-current="step"' : ""} class="${i + 1 < est.paso ? "hecho" : ""}">${t}</li>`).join("")}</ol>`; }
  function marco(html) { main.innerHTML = `<div class="cabecera-pagina"><div><h1>Nuevo trámite</h1><p>Completa los 4 pasos. Tu expediente se crea al confirmar.</p></div></div>${pasos()}<form id="f" class="panel" novalidate>${html}</form>`; main.querySelector("h1").focus?.(); }
  const error = (id, msg) => { const c = $("#" + id).closest(".campo, .panel"); c.classList.add("con-error"); const p = document.createElement("p"); p.className = "error-msg"; p.setAttribute("role", "alert"); p.textContent = msg; c.appendChild(p); $("#" + id).focus(); };
  const limpiar = () => $$(".con-error").forEach((c) => { c.classList.remove("con-error"); c.querySelectorAll(".error-msg").forEach((e) => e.remove()); });

  function paso1() {
    marco(`<h2>1. Elige el trámite</h2>
      <div class="campo"><label for="q">Busca por nombre</label><input id="q" type="search" placeholder="Ej.: constancia de estudios" autocomplete="off"></div>
      <div class="campo"><label for="sel">Procedimiento o servicio</label><select id="sel" size="8" style="min-height:12rem"></select><p class="ayuda" id="ayu">Elige uno de la lista. Solo se muestran los vigentes.</p></div>
      <div id="resumen"></div>
      <div class="fila"><button class="btn btn-primario" type="submit">Continuar</button><a class="btn btn-plano" href="catalogo.html">Revisar el TUPA</a></div>`);
    const llenar = () => {
      const q = plano($("#q").value).split(/\s+/).filter(Boolean);
      const l = todos.filter((p) => q.every((w) => plano(p.denominacion + " " + p.codigo).includes(w))).slice(0, 80);
      $("#sel").innerHTML = l.map((p) => `<option value="${p.id}"${est.proc && est.proc.id === p.id ? " selected" : ""}>${esc(p.denominacion)} (${esc(p.codigo)})</option>`).join("");
      $("#ayu").textContent = l.length ? `${l.length} opciones` : "No hay coincidencias. Prueba con otra palabra.";
    };
    const resumen = () => {
      const p = est.proc; $("#resumen").innerHTML = p ? `<div class="aviso-caja"><p><b>${esc(p.denominacion)}</b><br>Costo: ${esc(App.costoTexto(p))} · Plazo: ${p.plazo} día${p.plazo === 1 ? "" : "s"} hábil${p.plazo === 1 ? "" : "es"} · ${p.requisitos.filter((r) => r.tipo === "DOCUMENTO").length} documento(s) por adjuntar</p></div>` : "";
    };
    $("#q").addEventListener("input", llenar); llenar(); resumen();
    $("#sel").addEventListener("change", (e) => { est.proc = App.procedimiento(e.target.value); est.tarifa = 0; est.condiciones = {}; est.archivos = {}; resumen(); });
    $("#f").addEventListener("submit", (e) => { e.preventDefault(); limpiar(); if (!est.proc) return error("sel", "Elige un procedimiento para continuar."); est.paso = 2; paso2(); });
  }

  function paso2() {
    const p = proc(), cond = p.requisitos.filter((r) => r.tipo === "CONDICION");
    marco(`<h2>2. Tus datos</h2><p class="suave">Trámite: <b>${esc(p.denominacion)}</b></p>
      <div class="campo"><label for="asunto">Asunto de tu solicitud</label><input id="asunto" maxlength="200" value="${esc(est.asunto)}"><p class="ayuda">Una frase que diga para qué lo necesitas. Ej.: Constancia para postular a una beca.</p></div>
      <div class="form-fila"><div class="campo"><label for="correo">Correo de contacto</label><input id="correo" type="email" value="${esc(est.correo)}"></div>
      <div class="campo"><label for="telefono">Celular</label><input id="telefono" inputmode="numeric" maxlength="9" value="${esc(est.telefono)}"></div></div>
      ${p.tarifas.length > 1 ? `<div class="campo"><label for="tarifa">Tipo de derecho a pagar</label><select id="tarifa">${p.tarifas.map((t, i) => `<option value="${i}"${i === est.tarifa ? " selected" : ""}>${esc(t.concepto)} — ${fmtMonto(t.monto)}</option>`).join("")}</select></div>` : ""}
      ${cond.length ? `<fieldset class="campo" id="conds" style="border:0;padding:0"><legend>Confirma que cumples estas condiciones</legend>${cond.map((r) => `<label class="opcion"><input type="checkbox" data-o="${r.orden}"${est.condiciones[r.orden] ? " checked" : ""}> <span>${esc(r.descripcion)}</span></label>`).join("")}</fieldset>` : ""}
      <div class="fila"><button class="btn btn-plano" type="button" id="atras">Atrás</button><button class="btn btn-primario" type="submit">Continuar</button></div>`);
    $("#atras").addEventListener("click", () => { guardarDatos(); est.paso = 1; paso1(); });
    const guardarDatos = () => { est.asunto = $("#asunto").value; est.correo = $("#correo").value; est.telefono = $("#telefono").value; if ($("#tarifa")) est.tarifa = Number($("#tarifa").value); $$("#conds input").forEach((c) => (est.condiciones[c.dataset.o] = c.checked)); };
    $("#f").addEventListener("submit", (e) => {
      e.preventDefault(); limpiar(); guardarDatos();
      if (est.asunto.trim().length < 8) return error("asunto", "Describe el asunto con al menos 8 caracteres.");
      if (!/^\S+@\S+\.\S+$/.test(est.correo)) return error("correo", "Escribe un correo válido.");
      if (!/^9\d{8}$/.test(est.telefono)) return error("telefono", "El celular debe tener 9 dígitos y empezar con 9.");
      const falta = cond.find((r) => !est.condiciones[r.orden]);
      if (falta) return error("conds", "Debes confirmar todas las condiciones. Si no las cumples, este trámite no procede.");
      est.paso = 3; paso3();
    });
  }

  function paso3() {
    const docs = proc().requisitos.filter((r) => r.tipo === "DOCUMENTO");
    marco(`<h2>3. Documentos</h2><p class="suave">Formatos permitidos: PDF, ZIP, RAR, DOCX y XLSX. Máximo 50 MB por archivo.</p>
      ${docs.length ? docs.map((r) => `<div class="campo dropzone" data-o="${r.orden}"><label for="a${r.orden}">${esc(primera(r.descripcion))}</label>
        <input id="a${r.orden}" type="file" accept=".pdf,.zip,.rar,.docx,.xlsx"><p class="ayuda" id="i${r.orden}">${est.archivos[r.orden] ? "Adjunto: " + esc(est.archivos[r.orden].nombre) + " (" + fmtTam(est.archivos[r.orden].tam) + ")" : "Aún no adjuntas nada."}</p></div>`).join("") : '<div class="aviso-caja"><p>Este trámite no pide documentos adjuntos. Puedes continuar.</p></div>'}
      <div class="fila"><button class="btn btn-plano" type="button" id="atras">Atrás</button><button class="btn btn-primario" type="submit">Continuar</button></div>`);
    $$("input[type=file]").forEach((inp) => inp.addEventListener("change", () => {
      const o = inp.id.slice(1), f = inp.files[0], info = $("#i" + o), c = inp.closest(".campo"); c.classList.remove("con-error");
      if (!f) return; const ext = f.name.split(".").pop().toLowerCase();
      if (!EXT.includes(ext)) { c.classList.add("con-error"); info.textContent = `«${f.name}» no se acepta (.${ext}). Usa PDF, ZIP, RAR, DOCX o XLSX.`; inp.value = ""; delete est.archivos[o]; return; }
      if (f.size > MAX) { c.classList.add("con-error"); info.textContent = `«${f.name}» pesa ${fmtTam(f.size)} y supera los 50 MB.`; inp.value = ""; delete est.archivos[o]; return; }
      est.archivos[o] = { nombre: f.name, tam: f.size }; info.textContent = `Adjunto: ${f.name} (${fmtTam(f.size)})`;
    }));
    $("#atras").addEventListener("click", () => { est.paso = 2; paso2(); });
    $("#f").addEventListener("submit", (e) => {
      e.preventDefault(); limpiar();
      const falta = docs.find((r) => !est.archivos[r.orden]);
      if (falta) { const c = $(`[data-o="${falta.orden}"]`); c.classList.add("con-error"); $("#a" + falta.orden).focus(); $("#i" + falta.orden).textContent = "Falta este documento. Adjúntalo para continuar."; return; }
      est.paso = 4; paso4();
    });
  }

  function paso4() {
    const p = proc(), t = p.tarifas[est.tarifa] || p.tarifas[0], paga = t && t.monto > 0;
    marco(`<h2>4. Pago y confirmación</h2>
      <div class="hechos"><div class="hecho"><b style="font-size:1.1rem">${esc(p.denominacion)}</b><span>Trámite</span></div><div class="hecho"><b>${paga ? fmtMonto(t.monto) : "Gratuito"}</b><span>${paga ? esc(t.concepto) : "Sin pago"}</span></div><div class="hecho"><b>${p.plazo} día${p.plazo === 1 ? "" : "s"} hábil${p.plazo === 1 ? "" : "es"}</b><span>Plazo de atención</span></div></div>
      ${paga ? `<fieldset class="campo" style="border:0;padding:0"><legend>¿Ya pagaste?</legend>
        <label class="opcion"><input type="radio" name="pm" value="caja" ${est.pagoModo === "caja" ? "checked" : ""}> <span>Pagaré en caja. El trámite queda «Pendiente de pago» hasta que la oficina valide el comprobante.</span></label>
        <label class="opcion"><input type="radio" name="pm" value="ya" ${est.pagoModo === "ya" ? "checked" : ""}> <span>Ya pagué y tengo el número de operación.</span></label></fieldset>
        <div id="datos-pago" ${est.pagoModo === "ya" ? "" : "hidden"}><div class="form-fila"><div class="campo"><label for="nro">Número de operación</label><input id="nro" inputmode="numeric" value="${esc(est.nroOp)}"></div>
        <div class="campo"><label for="fp">Fecha de pago</label><input id="fp" type="date" max="${new Date().toISOString().slice(0, 10)}" value="${esc(est.fechaPago)}"></div></div></div>` : ""}
      <dl class="menor"><dt><b>Asunto</b></dt><dd>${esc(est.asunto)}</dd><dt><b>Contacto</b></dt><dd>${esc(est.correo)} · ${esc(est.telefono)}</dd><dt><b>Documentos</b></dt><dd>${Object.values(est.archivos).map((a) => esc(a.nombre)).join(", ") || "Ninguno"}</dd></dl>
      <div class="fila"><button class="btn btn-plano" type="button" id="atras">Atrás</button><button class="btn btn-primario" type="submit">Confirmar y registrar</button></div>`);
    $$("input[name=pm]").forEach((r) => r.addEventListener("change", () => { est.pagoModo = r.value; $("#datos-pago").hidden = r.value !== "ya"; }));
    $("#atras").addEventListener("click", () => { est.paso = 3; paso3(); });
    $("#f").addEventListener("submit", (e) => {
      e.preventDefault(); limpiar(); let pago = null;
      if (paga && est.pagoModo === "ya") {
        est.nroOp = $("#nro").value.trim(); est.fechaPago = $("#fp").value;
        if (!/^\d{4,12}$/.test(est.nroOp)) return error("nro", "El número de operación tiene entre 4 y 12 dígitos.");
        if (!est.fechaPago) return error("fp", "Indica la fecha en que pagaste.");
        pago = { nroOp: est.nroOp, fecha: new Date(est.fechaPago).toISOString() };
      }
      const docs = Object.entries(est.archivos).map(([orden, a]) => ({ orden: Number(orden), nombre: a.nombre, tam: a.tam, estado: "PENDIENTE", obs: "", version: 1, fecha: new Date().toISOString() }));
      const tr = App.crearTramite({ usr: u.id, proc: p.id, asunto: est.asunto.trim(), telefono: est.telefono, correo: est.correo, tarifa: est.tarifa, docs, condiciones: est.condiciones, pago });
      main.innerHTML = `<div class="panel" style="max-width:38rem"><h1>¡Trámite registrado!</h1><p>Tu número de expediente es:</p><p style="font-size:2rem;font-weight:700;color:var(--granate)" id="exp">${tr.exp}</p>
        <p>${tr.estado === 2 ? "Falta que se valide tu pago para que la oficina empiece la revisión." : "La oficina lo revisará en un máximo de " + p.plazo + " días hábiles."} Te avisaremos cada vez que cambie de estado.</p>
        <div class="fila"><a class="btn btn-primario" href="tramite.html?exp=${tr.exp}">Ver mi trámite</a><a class="btn btn-sec" href="nuevo-tramite.html">Registrar otro</a></div></div>`;
      App.toast("Trámite " + tr.exp + " registrado.", "exito");
    });
  }
  paso1();
});
