/* Registro de una cuenta de administrado */
App.montar({ pagina: "registro", titulo: "Crear cuenta", publica: true }, (main) => {
  const { esc, $, $$ } = App;
  main.innerHTML = `
  <div class="cabecera-pagina"><div><h1>Crear cuenta</h1><p>Con tu cuenta podrás registrar trámites y seguirlos desde cualquier dispositivo.</p></div></div>
  <form id="f" class="panel" novalidate style="max-width:40rem">
    <div class="campo"><label for="tipo">Soy</label>
      <select id="tipo"><option value="estudiante">Estudiante</option><option value="egresado">Egresado</option><option value="docente">Docente o personal</option><option value="externo">Persona externa a la UNSAAC</option></select></div>
    <div class="form-fila">
      <div class="campo"><label for="dni">DNI</label><input id="dni" inputmode="numeric" maxlength="8" autocomplete="off"><p class="ayuda">8 dígitos</p></div>
      <div class="campo" id="c-codigo"><label for="codigo">Código universitario</label><input id="codigo" inputmode="numeric" maxlength="6"><p class="ayuda">6 dígitos</p></div>
    </div>
    <div class="form-fila">
      <div class="campo"><label for="nombres">Nombres</label><input id="nombres" autocomplete="given-name"></div>
      <div class="campo"><label for="apellidos">Apellidos</label><input id="apellidos" autocomplete="family-name"></div>
    </div>
    <div class="form-fila">
      <div class="campo"><label for="correo">Correo electrónico</label><input id="correo" type="email" autocomplete="email"></div>
      <div class="campo"><label for="telefono">Celular</label><input id="telefono" inputmode="numeric" maxlength="9" autocomplete="tel"><p class="ayuda">9 dígitos, empieza con 9</p></div>
    </div>
    <div class="form-fila">
      <div class="campo"><label for="clave">Contraseña</label><input id="clave" type="password" autocomplete="new-password"><p class="ayuda">Mínimo 8 caracteres, con letras y números</p></div>
      <div class="campo"><label for="clave2">Repite la contraseña</label><input id="clave2" type="password" autocomplete="new-password"></div>
    </div>
    <div class="fila"><button class="btn btn-primario" type="submit">Crear cuenta</button><a class="btn btn-plano" href="index.html">Ya tengo cuenta</a></div>
  </form>`;
  const tipo = $("#tipo");
  const sync = () => { $("#c-codigo").hidden = !["estudiante", "egresado"].includes(tipo.value); };
  tipo.addEventListener("change", sync); sync();
  const reglas = {
    dni: (v) => /^\d{8}$/.test(v) || "El DNI debe tener 8 dígitos numéricos.",
    codigo: (v) => $("#c-codigo").hidden || /^\d{6}$/.test(v) || "El código universitario debe tener 6 dígitos.",
    nombres: (v) => v.trim().length >= 2 || "Escribe tus nombres.",
    apellidos: (v) => v.trim().length >= 2 || "Escribe tus apellidos.",
    correo: (v) => /^\S+@\S+\.\S+$/.test(v) || "Escribe un correo válido. Ejemplo: nombre@dominio.com",
    telefono: (v) => /^9\d{8}$/.test(v) || "El celular debe tener 9 dígitos y empezar con 9.",
    clave: (v) => (v.length >= 8 && /[a-zA-Z]/.test(v) && /\d/.test(v)) || "La contraseña necesita al menos 8 caracteres, con letras y números.",
    clave2: (v) => v === $("#clave").value || "Las contraseñas no coinciden.",
  };
  $("#f").addEventListener("submit", (e) => {
    e.preventDefault(); let primero = null;
    $$(".campo").forEach((c) => { c.classList.remove("con-error"); c.querySelector(".error-msg")?.remove(); });
    Object.entries(reglas).forEach(([id, fn]) => {
      const r = fn($("#" + id).value.trim()); if (r === true) return;
      const c = $("#" + id).closest(".campo"); c.classList.add("con-error");
      const p = document.createElement("p"); p.className = "error-msg"; p.id = "e-" + id; p.textContent = r; c.appendChild(p); $("#" + id).setAttribute("aria-describedby", p.id); primero ||= $("#" + id);
    });
    const S = App.estado;
    if (!primero && S.usuarios.some((u) => u.correo.toLowerCase() === $("#correo").value.trim().toLowerCase())) {
      const c = $("#correo").closest(".campo"); c.classList.add("con-error"); c.insertAdjacentHTML("beforeend", '<p class="error-msg">Ese correo ya tiene una cuenta. Ingresa con él.</p>'); primero = $("#correo");
    }
    if (!primero && S.usuarios.some((u) => u.dni === $("#dni").value.trim())) {
      const c = $("#dni").closest(".campo"); c.classList.add("con-error"); c.insertAdjacentHTML("beforeend", '<p class="error-msg">Ese DNI ya está registrado.</p>'); primero = $("#dni");
    }
    if (primero) { primero.focus(); return; }
    const id = S.siguiente.usuario++;
    S.usuarios.push({ id, rol: "ADMINISTRADO", oficina: null, tipo: tipo.value, dni: $("#dni").value.trim(), nombres: $("#nombres").value.trim(), apellidos: $("#apellidos").value.trim(),
      codigo: $("#c-codigo").hidden ? null : $("#codigo").value.trim(), correo: $("#correo").value.trim(), telefono: $("#telefono").value.trim(), clave: $("#clave").value, activo: true });
    App.guardar(); App.ingresarComo(id); location.href = "inicio.html";
  });
});
