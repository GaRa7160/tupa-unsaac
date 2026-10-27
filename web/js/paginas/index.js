/* Acceso: ingreso con correo y contraseña + cuentas de demostración */
(function () {
  const { esc, DEMO, $ } = App;
  if (App.usuarioActual()) { location.replace("inicio.html"); return; }
  document.title = "Ingresar · Trámites UNSAAC";
  const sig = new URLSearchParams(location.search).get("siguiente");
  const destino = sig && /^[\w-]+\.html/.test(sig) ? sig : "inicio.html";
  const cuentas = DEMO.cuentasRapidas.map((c) => `<button type="button" class="btn btn-sec" data-id="${c.id}">${esc(c.titulo)}<small>${esc(c.detalle)}</small></button>`).join("");
  $("#app").innerHTML = `
  <div class="acceso">
    <section class="acceso-izq" aria-label="Presentación">
      <img src="img/escudo-unsaac.png" alt="Escudo de la Universidad Nacional de San Antonio Abad del Cusco" width="148" height="191">
      <h1>Tus trámites de la UNSAAC, sin hacer colas</h1>
      <p>Consulta el TUPA, registra tu solicitud con sus requisitos y sigue por dónde va tu expediente.</p>
      <ul><li>80 procedimientos y servicios del TUPA vigente</li><li>Seguimiento paso a paso, con plazos en días hábiles</li><li>Avisos cuando tu trámite cambia de estado</li></ul>
    </section>
    <section class="acceso-der">
      <div class="contenido">
        <h2>Ingresar</h2>
        <form id="f" novalidate>
          <div class="campo"><label for="correo">Correo electrónico</label><input id="correo" type="email" autocomplete="username" inputmode="email" required></div>
          <div class="campo"><label for="clave">Contraseña</label><input id="clave" type="password" autocomplete="current-password" required></div>
          <button class="btn btn-primario btn-ancho" type="submit">Ingresar</button>
        </form>
        <p class="menor" style="margin-top:.75rem">¿Aún no tienes cuenta? <a href="registro.html">Crea una cuenta</a></p>
        <div class="separador">o prueba la demostración</div>
        <div class="demo-cuentas">${cuentas}</div>
        <p class="menor suave" style="margin-top:.75rem">Datos ficticios. Contraseña de todas las cuentas: <b>demo123</b></p>
        <p class="menor" style="margin-top:1rem"><a href="catalogo.html">Consultar el TUPA</a> · <a href="seguimiento.html">Seguimiento de un expediente</a></p>
        <p class="menor"><button type="button" class="btn btn-plano btn-chico" id="reiniciar">Restablecer datos de demostración</button></p>
      </div>
    </section>
  </div><div id="toasts" role="status" aria-live="polite"></div>`;
  const marcar = (id, msg) => {
    $$(".campo").forEach((c) => { c.classList.remove("con-error"); c.querySelector(".error-msg")?.remove(); });
    if (!id) return; const c = $("#" + id).closest(".campo"); c.classList.add("con-error");
    const p = document.createElement("p"); p.className = "error-msg"; p.id = "e-" + id; p.textContent = msg; c.appendChild(p);
    $("#" + id).setAttribute("aria-describedby", p.id); $("#" + id).focus();
  };
  const $$ = App.$$;
  $("#f").addEventListener("submit", (e) => {
    e.preventDefault(); const c = $("#correo").value.trim(), k = $("#clave").value;
    if (!c) return marcar("correo", "Escribe tu correo electrónico.");
    if (!/^\S+@\S+\.\S+$/.test(c)) return marcar("correo", "El correo no tiene un formato válido. Ejemplo: nombre@dominio.com");
    if (!k) return marcar("clave", "Escribe tu contraseña.");
    const r = App.ingresar(c, k);
    if (!r.ok) return marcar(r.campo, r.mensaje);
    location.href = destino;
  });
  $$(".demo-cuentas button").forEach((b) => b.addEventListener("click", () => { App.ingresarComo(b.dataset.id); location.href = destino; }));
  $("#reiniciar").addEventListener("click", () => { App.reiniciar(); App.toast("Datos de demostración restablecidos.", "exito"); });
})();
