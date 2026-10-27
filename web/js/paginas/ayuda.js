/* Ayuda: preguntas frecuentes, sedes y tickets de soporte */
App.montar({ pagina: "ayuda", titulo: "Ayuda" }, (main, u) => {
  const { esc, $, fmtFecha } = App;
  const S = App.estado;
  const faq = [
    ["¿Cómo registro un trámite?", "Ingresa a «Nuevo trámite», elige el procedimiento del TUPA, completa tus datos, adjunta los documentos y confirma. Recibirás un número de expediente."],
    ["¿Qué significan los estados?", "Registrado: recibido. Pendiente de pago: falta validar el pago. En revisión: la oficina revisa tus requisitos. Observado: debes corregir algo. Derivado: pasó a otra oficina. En atención: se está resolviendo. Resuelto: concluyó. Archivado: cerrado."],
    ["¿Cómo se cuentan los plazos?", "En días hábiles, de lunes a viernes. El plazo empieza al día siguiente de registrar el trámite."],
    ["¿Qué pasa si vence el plazo?", "En los procedimientos con silencio administrativo positivo se considera aprobado; en los de silencio negativo puedes presentar un recurso de reconsideración o apelación."],
    ["¿Qué archivos puedo adjuntar?", "PDF, ZIP, RAR, DOCX y XLSX, de hasta 50 MB cada uno."],
    ["¿Cómo pago?", "En caja de la UNSAAC o con depósito en el banco. Luego registra el número de operación en tu trámite para que sea validado."],
  ];
  const mios = S.tickets.filter((t) => t.usr === u.id);
  main.innerHTML = `<div class="cabecera-pagina"><div><h1>Ayuda</h1><p>Respuestas rápidas y contacto con soporte.</p></div></div>
  <div class="rejilla lateral"><div class="pila">
    <section class="panel"><h2>Preguntas frecuentes</h2>${faq.map(([q, a]) => `<details class="faq"><summary>${q}</summary><p>${a}</p></details>`).join("")}</section>
    <section class="panel"><h2>Sedes y horarios</h2><ul style="padding-left:1.1rem">${App.sedes.map((s) => `<li><b>${esc(s.nombre)}</b><br><span class="menor suave">${esc(s.direccion)} · ${esc(s.horario)}</span></li>`).join("")}</ul></section>
  </div><aside class="pila">
    <section class="panel"><h2>Generar un ticket</h2><form id="f" novalidate><div class="campo"><label for="as">Asunto</label><input id="as" maxlength="120"></div>
      <div class="campo"><label for="de">Cuéntanos qué pasó</label><textarea id="de" maxlength="600"></textarea></div><button class="btn btn-primario" type="submit">Enviar ticket</button></form></section>
    <section class="panel"><h3>Mis tickets</h3>${mios.length ? `<ul class="lista-req">${mios.map((t) => `<li><span class="ico">#${t.id}</span><span class="texto"><b>${esc(t.asunto)}</b><br><span class="menor suave">${fmtFecha(t.fecha)} · ${esc(t.estado === "PENDIENTE" ? "Pendiente" : "Atendido")}</span></span></li>`).join("")}</ul>` : '<p class="suave">Aún no has enviado tickets.</p>'}</section>
  </aside></div>`;
  $("#f").addEventListener("submit", (e) => {
    e.preventDefault(); App.$$(".con-error").forEach((c) => { c.classList.remove("con-error"); c.querySelector(".error-msg")?.remove(); });
    const f = (id, m) => { const c = $("#" + id).closest(".campo"); c.classList.add("con-error"); c.insertAdjacentHTML("beforeend", `<p class="error-msg">${m}</p>`); $("#" + id).focus(); };
    if ($("#as").value.trim().length < 5) return f("as", "Escribe un asunto de al menos 5 caracteres.");
    if ($("#de").value.trim().length < 10) return f("de", "Cuéntanos el problema con al menos 10 caracteres.");
    S.tickets.unshift({ id: S.siguiente.ticket++, usr: u.id, tramite: "", asunto: $("#as").value.trim(), detalle: $("#de").value.trim(), estado: "PENDIENTE", fecha: new Date().toISOString() });
    App.guardar(); App.toast("Ticket enviado. Te responderemos por correo.", "exito"); setTimeout(() => location.reload(), 600);
  });
});
