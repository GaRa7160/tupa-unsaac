/* Mantenimiento: catálogo del TUPA, usuarios y datos de demostración */
App.montar({ pagina: "admin", titulo: "Mantenimiento", roles: ["ADMINISTRADOR"] }, (main, u) => {
  const { esc, plano, $, $$, fmtMonto } = App;
  const S = App.estado;
  let tab = "catalogo";
  function marco() {
    main.innerHTML = `<div class="cabecera-pagina"><div><h1>Mantenimiento</h1><p>Administra el catálogo del TUPA y las cuentas de usuario.</p></div></div>
      <div class="pestanas" role="tablist">${[["catalogo", "Catálogo"], ["nuevo", "Nuevo procedimiento"], ["usuarios", "Usuarios"], ["datos", "Datos de demostración"]].map(([id, t]) => `<button role="tab" data-t="${id}" aria-selected="${id === tab}">${t}</button>`).join("")}</div><div id="cont"></div>`;
    $$("[data-t]").forEach((b) => b.addEventListener("click", () => { tab = b.dataset.t; marco(); }));
    ({ catalogo, nuevo, usuarios, datos })[tab]();
  }
  function catalogo() {
    $("#cont").innerHTML = `<div class="campo"><label for="q">Buscar procedimiento</label><input id="q" type="search"></div><div class="panel" style="padding:0"><div class="tabla-envoltura"><table class="tabla-resp"><thead><tr><th>Código</th><th>Denominación</th><th class="num">Plazo</th><th>Vigente</th><th></th></tr></thead><tbody id="tb"></tbody></table></div></div><p class="menor suave" id="n"></p>`;
    const pintar = () => {
      const q = plano($("#q").value), l = App.procedimientos(true).filter((p) => plano(p.codigo + " " + p.denominacion).includes(q)).slice(0, 60);
      $("#n").textContent = `Se muestran ${l.length} (máximo 60). Usa el buscador para encontrar otros.`;
      $("#tb").innerHTML = l.map((p) => `<tr><td data-label="Código">${esc(p.codigo)}</td><td data-label="Denominación">${esc(p.denominacion)}</td><td class="num" data-label="Plazo">${p.plazo} días</td><td data-label="Vigente"><span class="etiqueta ${p.vigente === false ? "error" : "exito"}">${p.vigente === false ? "No vigente" : "Vigente"}</span></td><td><button class="btn btn-chico btn-sec" data-e="${p.id}">Editar</button></td></tr>`).join("");
      $$("[data-e]").forEach((b) => b.addEventListener("click", () => editar(App.procedimiento(b.dataset.e), pintar)));
    };
    $("#q").addEventListener("input", pintar); pintar();
  }
  function editar(p, refrescar) {
    const d = App.dialogo(`<form method="dialog"><h2>Editar procedimiento</h2><p class="menor suave">${esc(p.denominacion)}</p>
      <div class="campo"><label for="pl">Plazo (días hábiles)</label><input id="pl" type="number" min="1" max="120" value="${p.plazo}"></div>
      <label class="opcion"><input type="checkbox" id="vg" ${p.vigente === false ? "" : "checked"}> <span>Procedimiento vigente (visible para los administrados)</span></label>
      <div class="acciones"><button type="button" class="btn btn-plano" data-cerrar>Cancelar</button><button class="btn btn-primario" value="ok">Guardar</button></div></form>`);
    d.querySelector("form").addEventListener("submit", (e) => {
      const pl = Number(d.querySelector("#pl").value);
      if (!(pl >= 1 && pl <= 120)) { e.preventDefault(); App.toast("El plazo debe estar entre 1 y 120 días hábiles.", "error"); return; }
      const nuevo = S.nuevos.find((x) => x.id === p.id);
      if (nuevo) { nuevo.plazo = pl; nuevo.vigente = d.querySelector("#vg").checked; } else S.cambios[p.id] = { ...(S.cambios[p.id] || {}), plazo: pl, vigente: d.querySelector("#vg").checked };
      App.guardar(); App.toast("Procedimiento actualizado.", "exito"); refrescar();
    });
  }
  function nuevo() {
    $("#cont").innerHTML = `<form id="f" class="panel" novalidate style="max-width:42rem"><div class="campo"><label for="den">Denominación</label><input id="den" maxlength="200"></div>
      <div class="form-fila"><div class="campo"><label for="cat">Categoría</label><select id="cat">${App.categorias.map((c) => `<option value="${c.id}">${esc(c.nombre)}</option>`).join("")}</select></div>
      <div class="campo"><label for="plz">Plazo (días hábiles)</label><input id="plz" type="number" min="1" max="120" value="5"></div></div>
      <div class="form-fila"><div class="campo"><label for="mon">Costo (S/)</label><input id="mon" type="number" min="0" step="0.01" value="0"></div>
      <div class="campo"><label for="ofi">Oficina que lo resuelve</label><select id="ofi">${App.oficinas.map((o) => `<option value="${o.id}">${esc(o.nombre)}</option>`).join("")}</select></div></div>
      <div class="campo"><label for="des">Descripción</label><textarea id="des"></textarea></div>
      <div class="campo"><label for="req">Requisitos (uno por línea)</label><textarea id="req"></textarea></div>
      <button class="btn btn-primario" type="submit">Agregar al catálogo</button></form>`;
    $("#f").addEventListener("submit", (e) => {
      e.preventDefault(); $$(".con-error").forEach((c) => { c.classList.remove("con-error"); c.querySelector(".error-msg")?.remove(); });
      const f = (id, m) => { const c = $("#" + id).closest(".campo"); c.classList.add("con-error"); c.insertAdjacentHTML("beforeend", `<p class="error-msg">${m}</p>`); $("#" + id).focus(); };
      if ($("#den").value.trim().length < 5) return f("den", "Escribe la denominación (mínimo 5 caracteres).");
      const plz = Number($("#plz").value); if (!(plz >= 1 && plz <= 120)) return f("plz", "El plazo debe estar entre 1 y 120.");
      const mon = Number($("#mon").value); if (!(mon >= 0)) return f("mon", "El costo no puede ser negativo.");
      const id = 1000 + S.nuevos.length + 1, ofi = Number($("#ofi").value);
      S.nuevos.push({ id, codigo: "PA-" + String(id).slice(1), seccion: "Procedimiento administrativo", categoria: Number($("#cat").value), denominacion: $("#den").value.trim(), descripcion: $("#des").value.trim(),
        requisitos: $("#req").value.split("\n").map((s) => s.trim()).filter(Boolean).map((s, i) => ({ orden: i + 1, descripcion: s, tipo: "DOCUMENTO" })), notas: "", canal: "Presencial", tarifas: mon > 0 ? [{ concepto: "Derecho de trámite", monto: mon }] : [],
        modalidad: mon > 0 ? "Caja" : "", plazo: plz, calificacion: "Evaluación previa - Silencio administrativo negativo", presentacion: [ofi], responsable: ofi, recursos: [], vigente: true });
      App.guardar(); App.toast("Procedimiento agregado.", "exito"); tab = "catalogo"; marco();
    });
  }
  function usuarios() {
    $("#cont").innerHTML = `<div class="panel" style="padding:0"><div class="tabla-envoltura"><table class="tabla-resp"><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th></th></tr></thead><tbody>${S.usuarios.map((x) => `<tr><td data-label="Nombre">${esc(App.nombreUsuario(x))}</td><td data-label="Correo">${esc(x.correo)}</td><td data-label="Rol">${esc(App.DEMO.roles[x.rol])}</td><td data-label="Estado"><span class="etiqueta ${x.activo === false ? "error" : "exito"}">${x.activo === false ? "Desactivado" : "Activo"}</span></td><td>${x.id === u.id ? "" : `<button class="btn btn-chico btn-plano" data-u="${x.id}">${x.activo === false ? "Activar" : "Desactivar"}</button>`}</td></tr>`).join("")}</tbody></table></div></div>`;
    $$("[data-u]").forEach((b) => b.addEventListener("click", () => { const x = App.usuario(b.dataset.u); x.activo = x.activo === false; App.guardar(); App.toast(x.activo ? "Usuario activado." : "Usuario desactivado.", "exito"); usuarios(); }));
  }
  function datos() {
    $("#cont").innerHTML = `<div class="panel"><h2>Restablecer datos de demostración</h2><p>Borra los trámites, usuarios y cambios hechos en esta sesión y vuelve a cargar los datos iniciales.</p><button class="btn btn-peligro" id="rs">Restablecer datos</button></div>`;
    $("#rs").addEventListener("click", () => { const d = App.dialogo(`<form method="dialog"><h2>¿Restablecer los datos?</h2><p>Se perderán los cambios hechos. Esta acción no se puede deshacer.</p><div class="acciones"><button type="button" class="btn btn-plano" data-cerrar>Cancelar</button><button class="btn btn-peligro" value="ok">Sí, restablecer</button></div></form>`); d.querySelector("form").addEventListener("submit", () => { App.reiniciar(); location.href = "index.html"; }); });
  }
  marco();
});
