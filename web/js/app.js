/* =============================================================
   Plataforma TUPA UNSAAC - núcleo de la aplicación (demostración sin servidor)
   - Estado en localStorage (reemplaza a la BD hasta la Entrega 3)
   - Sesión, navegación por rol, utilidades de interfaz y reglas de negocio
   Las reglas del trámite (estados, plazos en días hábiles, silencio administrativo)
   replican las del script database/01_schema.sql.
   ============================================================= */
(function () {
  "use strict";
  const TUPA = window.TUPA;
  const DEMO = window.DEMO;
  const CLAVE_ALMACEN = "tupa_unsaac_demo_v2";

  /* ---------- utilidades ---------- */
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const plano = (s) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const pad = (n) => String(n).padStart(2, "0");
  const fmtFecha = (iso) => { if (!iso) return "—"; const d = new Date(iso); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
  const fmtFechaHora = (iso) => { if (!iso) return "—"; const d = new Date(iso); return `${fmtFecha(iso)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const fmtMonto = (n) => (Number(n) === 0 ? "Gratuito" : "S/ " + Number(n).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const fmtTam = (b) => (b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.max(1, Math.round(b / 1024)) + " KB");
  const inicioDia = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const sumarHabiles = (desde, n) => { const d = inicioDia(desde); let r = n; while (r > 0) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) r--; } return d; };
  /** Días hábiles que faltan hasta `limite` (negativo si ya venció). */
  const habilesHasta = (limite) => {
    const hoy = inicioDia(new Date()), fin = inicioDia(limite);
    if (fin.getTime() === hoy.getTime()) return 0;
    const signo = fin > hoy ? 1 : -1; let n = 0; const d = new Date(signo > 0 ? hoy : fin); const tope = signo > 0 ? fin : hoy;
    while (d < tope) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0 && d.getDay() !== 6) n++; }
    return n * signo;
  };
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ---------- iconos (trazo, 24x24) ---------- */
  const ICONOS = {
    inicio: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h5v-6h4v6h5V10"/>',
    buscar: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    nuevo: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M12 11v6M9 14h6"/>',
    lista: '<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',
    ruta: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.5 6H14a3 3 0 010 6h-4a3 3 0 000 6h5.5"/>',
    campana: '<path d="M6 16V11a6 6 0 0112 0v5l2 2H4z"/><path d="M10 21h4"/>',
    ayuda: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01"/>',
    bandeja: '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>',
    grafico: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-5M12 16V8M16 16v-3"/>',
    ajustes: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 00-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 00-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 00-2 1.2l-2.3-1-2 3.4 2 1.5A7 7 0 005 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-1a7 7 0 002 1.2l.4 2.7h4l.4-2.7a7 7 0 002-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>',
    salir: '<path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    adjunto: '<path d="M20 11l-8.5 8.5a5 5 0 01-7-7L13 4a3.5 3.5 0 015 5l-8.5 8.5a2 2 0 01-3-3L14 7"/>',
  };
  const icono = (n) => `<svg class="icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONOS[n] || ""}</svg>`;

  /* ---------- catálogo (TUPA real + cambios del administrador) ---------- */
  const estadoPorId = Object.fromEntries(DEMO.estados.map((e) => [e.id, e]));
  const oficinaPorId = Object.fromEntries(TUPA.oficinas.map((o) => [o.id, o]));
  const oficinaPorSigla = Object.fromEntries(TUPA.oficinas.map((o) => [o.sigla, o]));
  const categoriaPorId = Object.fromEntries(TUPA.categorias.map((c) => [c.id, c]));
  const sedePorId = Object.fromEntries(TUPA.sedes.map((s) => [s.id, s]));
  const procPorNombre = (nombre) => {
    const n = plano(nombre);
    return TUPA.procedimientos.find((p) => plano(p.denominacion).replace(/[.\s]+$/, "") === n) ||
           TUPA.procedimientos.find((p) => plano(p.denominacion).startsWith(n));
  };

  /* ---------- estado persistente ---------- */
  let S = null;

  function semilla() {
    const est = { version: 2, sesion: null, usuarios: [], tramites: [], notificaciones: [], tickets: [], cambios: {}, nuevos: [], siguiente: { tramite: 1, ticket: 1, usuario: 100, notif: 1 } };
    DEMO.usuarios.forEach((u) => est.usuarios.push({ ...u, oficina: u.oficina ? oficinaPorSigla[u.oficina].id : null, activo: true }));
    DEMO.tramites.forEach((t) => {
      const p = procPorNombre(t.nom);
      if (!p) { console.warn("Procedimiento no encontrado en el TUPA:", t.nom); return; }
      const reg = new Date(); reg.setHours(9, 0, 0, 0); reg.setDate(reg.getDate() - t.dias);
      const usuario = est.usuarios.find((u) => u.id === t.usr);
      let oficina = p.presentacion[0]; const hist = [];
      t.hist.forEach(([estado, sigla, despues, uid, comentario], i) => {
        const nueva = sigla ? oficinaPorSigla[sigla].id : oficina;
        const f = new Date(reg); f.setDate(f.getDate() + despues); f.setHours(9 + (i % 7), 10 * (i % 5), 0, 0);
        hist.push({ estado, origen: i === 0 ? null : oficina, destino: nueva, usr: uid, comentario, fecha: f.toISOString() });
        oficina = nueva;
      });
      const ultimo = hist[hist.length - 1];
      const tr = {
        id: est.siguiente.tramite++, exp: `${reg.getFullYear()}-${String(t.exp).padStart(6, "0")}`, usr: t.usr, proc: p.id,
        asunto: t.asunto, telefono: usuario.telefono, correo: usuario.correo, estado: ultimo.estado, oficina,
        registro: reg.toISOString(), limite: sumarHabiles(reg, p.plazo).toISOString(),
        cierre: hist.find((h) => h.estado === 7)?.fecha || null, tarifa: t.tarifa, hist, docs: [], condiciones: {}, pago: null,
      };
      armarDocsYPago(tr, p);
      est.tramites.push(tr);
      hist.forEach((h, i) => {
        if (i === 0) return;
        est.notificaciones.push({ id: est.siguiente.notif++, usr: t.usr, tramite: tr.exp, titulo: `Trámite ${estadoPorId[h.estado].nombre.toLowerCase()}`,
          mensaje: `Tu trámite ${tr.exp} (${p.denominacion}) cambió a: ${estadoPorId[h.estado].nombre}. ${h.comentario}`, fecha: h.fecha,
          leida: (Date.now() - new Date(h.fecha)) > 4 * 864e5 });
      });
    });
    est.tickets.push({ id: est.siguiente.ticket++, usr: 6, tramite: "2026-000002", asunto: "No puedo subir las fotografías", detalle: "El sistema rechaza el archivo .zip de 1 MB", estado: "PENDIENTE", fecha: new Date(Date.now() - 2 * 864e5).toISOString() });
    return est;
  }

  /** Documentos y pago de un trámite según su estado (para los datos de demostración y los trámites nuevos). */
  function armarDocsYPago(tr, p) {
    const cierra = tr.estado >= 7, enRevision = tr.estado >= 3 && tr.estado !== 4;
    p.requisitos.forEach((r, i) => {
      if (r.tipo === "DOCUMENTO") {
        const nombre = plano(r.descripcion.split("\n")[0]).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 36) + ".pdf";
        tr.docs.push({ orden: r.orden, nombre, tam: 180000 + ((i * 73123) % 800000), estado: cierra || tr.estado >= 5 ? "APROBADO" : "PENDIENTE", obs: "", version: 1, fecha: tr.registro });
      } else if (r.tipo === "CONDICION") tr.condiciones[r.orden] = true;
    });
    if (tr.estado === 4) {
      const d = tr.docs.find((x) => /fotograf/i.test(p.requisitos.find((r) => r.orden === x.orden).descripcion)) || tr.docs[0];
      if (d) { d.estado = "OBSERVADO"; d.obs = tr.hist[tr.hist.length - 1].comentario; }
      tr.docs.forEach((x) => { if (x !== d) x.estado = "APROBADO"; });
    }
    const t = p.tarifas[Math.min(tr.tarifa || 0, p.tarifas.length - 1)];
    if (t && t.monto > 0) {
      const pendiente = tr.estado <= 2;
      tr.pago = { monto: t.monto, concepto: t.concepto, estado: pendiente ? "PENDIENTE" : "VALIDADO", nroOp: pendiente ? "" : "OP-" + (580000 + tr.id * 37), fecha: pendiente ? null : tr.registro };
    }
    if (enRevision && tr.pago && tr.pago.estado === "PENDIENTE") tr.pago.estado = "VALIDADO";
  }

  function cargar() {
    try { const t = localStorage.getItem(CLAVE_ALMACEN); if (t) { const o = JSON.parse(t); if (o.version === 2) return o; } } catch (e) { /* sin almacenamiento */ }
    return null;
  }
  function guardar() { try { localStorage.setItem(CLAVE_ALMACEN, JSON.stringify(S)); } catch (e) { /* modo privado: se trabaja en memoria */ } }
  function reiniciar() { S = semilla(); guardar(); }
  S = cargar() || semilla();
  if (!cargar()) guardar();

  /* ---------- catálogo con cambios del administrador ---------- */
  function procedimientos(incluirNoVigentes = false) {
    const lista = TUPA.procedimientos.map((p) => ({ ...p, ...(S.cambios[p.id] || {}), vigente: S.cambios[p.id]?.vigente !== false })).concat(S.nuevos);
    return incluirNoVigentes ? lista : lista.filter((p) => p.vigente !== false);
  }
  const procedimiento = (id) => procedimientos(true).find((p) => p.id === Number(id));
  const procedimientoPorCodigo = (c) => procedimientos(true).find((p) => p.codigo === c);
  const oficina = (id) => oficinaPorId[id];
  const usuario = (id) => S.usuarios.find((u) => u.id === Number(id));
  const tramitePorExp = (exp) => S.tramites.find((t) => t.exp === String(exp).trim());
  const nombreUsuario = (u) => (u ? `${u.nombres} ${u.apellidos}` : "Sistema");
  const costoTexto = (p) => {
    const m = p.tarifas.map((t) => t.monto);
    if (!m.length) return "—";
    const min = Math.min(...m), max = Math.max(...m);
    return min === max ? fmtMonto(min) : `${fmtMonto(min)} a ${fmtMonto(max)}`;
  };

  /* ---------- sesión ---------- */
  const usuarioActual = () => (S.sesion ? usuario(S.sesion) : null);
  function ingresar(correo, clave) {
    const u = S.usuarios.find((x) => x.correo.toLowerCase() === String(correo).trim().toLowerCase() && x.activo !== false);
    if (!u) return { ok: false, campo: "correo", mensaje: "No existe una cuenta con ese correo. Revisa que esté bien escrito o crea una cuenta." };
    if ((u.clave || DEMO.clave) !== clave) return { ok: false, campo: "clave", mensaje: "La contraseña no es correcta. En esta demostración todas las cuentas usan: demo123" };
    S.sesion = u.id; guardar(); return { ok: true, usuario: u };
  }
  function ingresarComo(id) { S.sesion = Number(id); guardar(); }
  function salir() { S.sesion = null; guardar(); location.href = "index.html"; }

  /* ---------- navegación por rol ---------- */
  const NAV = {
    ADMINISTRADO: [["inicio", "Inicio", "inicio"], ["catalogo", "Consultar el TUPA", "buscar"], ["nuevo-tramite", "Nuevo trámite", "nuevo"], ["mis-tramites", "Mis trámites", "lista"], ["seguimiento", "Seguimiento", "ruta"], ["notificaciones", "Notificaciones", "campana"], ["ayuda", "Ayuda", "ayuda"]],
    MESA_PARTES: [["inicio", "Inicio", "inicio"], ["panel-oficina", "Bandeja de trámites", "bandeja"], ["catalogo", "Consultar el TUPA", "buscar"], ["seguimiento", "Seguimiento", "ruta"], ["notificaciones", "Notificaciones", "campana"], ["reportes", "Reportes", "grafico"], ["ayuda", "Ayuda", "ayuda"]],
    OFICINA: [["inicio", "Inicio", "inicio"], ["panel-oficina", "Bandeja de la oficina", "bandeja"], ["catalogo", "Consultar el TUPA", "buscar"], ["seguimiento", "Seguimiento", "ruta"], ["notificaciones", "Notificaciones", "campana"], ["reportes", "Reportes", "grafico"], ["ayuda", "Ayuda", "ayuda"]],
    ADMINISTRADOR: [["inicio", "Inicio", "inicio"], ["panel-oficina", "Todos los trámites", "bandeja"], ["catalogo", "Consultar el TUPA", "buscar"], ["reportes", "Reportes", "grafico"], ["admin", "Mantenimiento", "ajustes"], ["ayuda", "Ayuda", "ayuda"]],
  };

  /* ---------- montaje de la página ---------- */
  function noLeidas() { const u = usuarioActual(); return u ? S.notificaciones.filter((n) => n.usr === u.id && !n.leida).length : 0; }

  /**
   * opts: { pagina, titulo, publica?, roles? }   render(main, usuario)
   */
  function montar(opts, render) {
    const u = usuarioActual();
    if (!opts.publica && !u) { location.replace("index.html?siguiente=" + encodeURIComponent(location.pathname.split("/").pop() + location.search)); return; }
    if (opts.roles && u && !opts.roles.includes(u.rol)) { location.replace("inicio.html?sinacceso=1"); return; }
    document.title = `${opts.titulo} · Trámites UNSAAC`;
    const raiz = $("#app");
    const marca = `<a class="marca" href="${u ? "inicio.html" : "index.html"}"><img src="img/escudo-unsaac.png" alt="" width="148" height="191"><span>Trámites UNSAAC<small>Texto Único de Procedimientos Administrativos</small></span></a>`;
    let barra, menu = "";
    if (u) {
      const n = noLeidas();
      barra = `<header class="barra">
        <button class="btn-icono" id="btn-menu" aria-label="Abrir el menú" aria-expanded="false" aria-controls="menu">${icono("menu")}</button>
        ${marca}<span class="espacio"></span>
        <span class="rol-activo">${esc(DEMO.roles[u.rol])}</span>
        <a class="btn-icono" href="notificaciones.html" aria-label="Notificaciones${n ? `, ${n} sin leer` : ""}">${icono("campana")}${n ? `<span class="contador" aria-hidden="true">${n}</span>` : ""}</a>
        <button class="btn-icono" id="btn-salir" aria-label="Cerrar sesión">${icono("salir")}</button>
      </header>`;
      const items = NAV[u.rol].map(([id, texto, ic]) => `<li><a class="item" href="${id}.html"${id === opts.pagina ? ' aria-current="page"' : ""}>${icono(ic)}<span>${texto}</span></a></li>`).join("");
      const sedeOf = u.oficina ? esc(oficina(u.oficina).nombre) : esc(u.tipo.charAt(0).toUpperCase() + u.tipo.slice(1));
      const cuentas = DEMO.cuentasRapidas.map((c) => `<option value="${c.id}"${c.id === u.id ? " selected" : ""}>${esc(c.titulo)}</option>`).join("");
      const extra = !DEMO.cuentasRapidas.some((c) => c.id === u.id) ? `<option value="${u.id}" selected>${esc(nombreUsuario(u))}</option>` : "";
      menu = `<nav class="menu" id="menu" aria-label="Menú principal">
        <div class="perfil"><strong>${esc(nombreUsuario(u))}</strong><span>${sedeOf}${u.codigo ? " · " + esc(u.codigo) : ""}</span></div>
        <ul>${items}</ul>
        <div class="grupo">Cuenta de demostración</div>
        <div style="padding:0 .75rem"><label class="sr-only" for="cambiar-cuenta">Cambiar de cuenta de demostración</label>
          <select id="cambiar-cuenta">${extra}${cuentas}</select>
          <p class="menor suave" style="margin-top:.4rem">Cambia de rol para recorrer cada vista.</p></div>
      </nav>`;
    } else {
      barra = `<header class="barra">${marca}<span class="espacio"></span>
        <a class="btn btn-chico" style="background:rgba(255,255,255,.14)" href="catalogo.html">Consultar el TUPA</a>
        <a class="btn btn-chico" style="background:rgba(255,255,255,.14)" href="seguimiento.html">Seguimiento</a>
        <a class="btn btn-chico" style="background:#fff;color:var(--granate)" href="index.html">Ingresar</a></header>`;
    }
    raiz.innerHTML = `<a class="saltar" href="#principal">Saltar al contenido</a>${barra}
      <div class="cuerpo" ${u ? "" : 'style="grid-template-columns:1fr"'}>${menu}<main class="principal" id="principal" tabindex="-1"></main></div><div id="toasts" role="status" aria-live="polite"></div>`;
    const main = $("#principal");
    if (u) {
      $("#btn-salir").addEventListener("click", salir);
      const bm = $("#btn-menu"), m = $("#menu");
      bm.addEventListener("click", () => { const ab = m.classList.toggle("abierto"); bm.setAttribute("aria-expanded", ab); });
      $("#cambiar-cuenta").addEventListener("change", (e) => { ingresarComo(e.target.value); location.href = "inicio.html"; });
    }
    render(main, u);
    const sin = new URLSearchParams(location.search).get("sinacceso");
    if (sin) toast("Tu rol no tiene acceso a esa pantalla.", "error");
  }

  function toast(mensaje, tipo = "") {
    const c = $("#toasts"); if (!c) return;
    const t = document.createElement("div"); t.className = "toast " + tipo; t.textContent = mensaje; c.appendChild(t);
    setTimeout(() => t.remove(), 5200);
  }

  /** Abre un cuadro de diálogo modal con el HTML dado y devuelve el <dialog>. */
  function dialogo(html) {
    const d = document.createElement("dialog"); d.innerHTML = html; document.body.appendChild(d);
    d.addEventListener("close", () => d.remove());
    d.querySelectorAll("[data-cerrar]").forEach((b) => b.addEventListener("click", () => d.close()));
    d.showModal(); return d;
  }

  /* ---------- insignias y etapas ---------- */
  const insigniaEstado = (id) => { const e = estadoPorId[id]; return `<span class="insignia" style="--c:${e.color}">${esc(e.nombre)}</span>`; };
  function etapas(tr) {
    const e = tr.estado; const seg = [1, 3, 5, 6, 7].map((id) => id);
    const pos = { 1: 0, 2: 0, 3: 1, 4: 1, 5: 2, 6: 3, 7: 4, 8: 4 }[e];
    return `<span class="etapas" role="img" aria-label="Etapa ${pos + 1} de 5: ${esc(estadoPorId[e].nombre)}">${seg.map((_, i) => `<i class="${i < pos ? "hecho" : i === pos ? (e === 4 ? "obs" : e >= 7 ? "hecho" : "actual") : ""}"></i>`).join("")}</span>`;
  }
  function plazoTexto(tr) {
    const p = procedimiento(tr.proc);
    if (tr.estado >= 7) return { texto: "Cerrado el " + fmtFecha(tr.cierre), clase: "" };
    const d = habilesHasta(tr.limite);
    if (d < 0) return { texto: `Vencido hace ${-d} día${-d === 1 ? "" : "s"} hábil${-d === 1 ? "" : "es"}`, clase: "error", silencio: /positivo/i.test(p.calificacion) };
    if (d === 0) return { texto: "Vence hoy", clase: "aviso" };
    return { texto: `${d} día${d === 1 ? "" : "s"} hábil${d === 1 ? "" : "es"}`, clase: d <= 1 ? "aviso" : "" };
  }

  /* ---------- reglas de negocio ---------- */
  function notificar(uid, exp, titulo, mensaje) {
    S.notificaciones.unshift({ id: S.siguiente.notif++, usr: uid, tramite: exp, titulo, mensaje, fecha: new Date().toISOString(), leida: false });
  }

  function crearTramite({ usr, proc, asunto, telefono, correo, tarifa, docs, condiciones, pago }) {
    const p = procedimiento(proc), ahora = new Date();
    const delAnio = S.tramites.filter((t) => t.exp.startsWith(ahora.getFullYear() + "-")).map((t) => Number(t.exp.slice(5)));
    const exp = `${ahora.getFullYear()}-${String(Math.max(0, ...delAnio) + 1).padStart(6, "0")}`;
    const t = p.tarifas[tarifa] || p.tarifas[0];
    const debePagar = t && t.monto > 0;
    const pagado = debePagar && pago && pago.nroOp;
    const estado = debePagar && !pagado ? 2 : 1;
    const oficinaInicial = p.presentacion[0];
    const tr = {
      id: S.siguiente.tramite++, exp, usr, proc: p.id, asunto, telefono, correo, estado, oficina: oficinaInicial,
      registro: ahora.toISOString(), limite: sumarHabiles(ahora, p.plazo).toISOString(), cierre: null, tarifa, hist: [], docs: docs || [], condiciones: condiciones || {},
      pago: debePagar ? { monto: t.monto, concepto: t.concepto, estado: "PENDIENTE", nroOp: pagado ? pago.nroOp : "", fecha: pagado ? pago.fecha : null } : null,
    };
    tr.hist.push({ estado: 1, origen: null, destino: oficinaInicial, usr, comentario: "Trámite registrado por el administrado", fecha: ahora.toISOString() });
    if (estado === 2) tr.hist.push({ estado: 2, origen: oficinaInicial, destino: oficinaInicial, usr: null, comentario: `Pendiente el pago de ${fmtMonto(t.monto)} en caja o con comprobante`, fecha: new Date(ahora.getTime() + 1000).toISOString() });
    S.tramites.unshift(tr);
    notificar(usr, exp, "Trámite registrado", `Tu trámite ${exp} (${p.denominacion}) fue registrado. ${estado === 2 ? "Falta registrar el pago para que la oficina lo revise." : "La oficina lo revisará en un máximo de " + p.plazo + " días hábiles."}`);
    guardar();
    return tr;
  }

  function puedeCambiar(tr, nuevo) { return (DEMO.transiciones[tr.estado] || []).includes(nuevo); }

  function cambiarEstado(exp, nuevo, { destino = null, usr, comentario = "" } = {}) {
    const tr = tramitePorExp(exp); if (!tr) return { ok: false, mensaje: "No existe el trámite." };
    if (!puedeCambiar(tr, nuevo)) return { ok: false, mensaje: `No se puede pasar de «${estadoPorId[tr.estado].nombre}» a «${estadoPorId[nuevo].nombre}».` };
    if (nuevo === 4 && !comentario.trim()) return { ok: false, mensaje: "Para observar un trámite hay que indicar qué debe corregir el administrado." };
    if (nuevo === 5 && !destino) return { ok: false, mensaje: "Elige la oficina a la que se deriva el trámite." };
    const origen = tr.oficina;
    if (nuevo === 5) tr.oficina = Number(destino);
    tr.estado = nuevo;
    if (nuevo === 7) tr.cierre = new Date().toISOString();
    tr.hist.push({ estado: nuevo, origen, destino: tr.oficina, usr, comentario: comentario || estadoPorId[nuevo].nombre, fecha: new Date().toISOString() });
    const p = procedimiento(tr.proc);
    notificar(tr.usr, tr.exp, `Trámite ${estadoPorId[nuevo].nombre.toLowerCase()}`, `Tu trámite ${tr.exp} (${p.denominacion}) cambió a: ${estadoPorId[nuevo].nombre}.${comentario ? " " + comentario : ""}`);
    guardar(); return { ok: true, tramite: tr };
  }

  function validarDocumento(exp, orden, estado, obs, usr) {
    const tr = tramitePorExp(exp); const d = tr?.docs.find((x) => x.orden === Number(orden)); if (!d) return false;
    d.estado = estado; d.obs = obs || ""; d.validador = usr; d.validado = new Date().toISOString(); guardar(); return true;
  }
  function subirDocumento(exp, orden, archivo) {
    const tr = tramitePorExp(exp); if (!tr) return false;
    let d = tr.docs.find((x) => x.orden === Number(orden));
    if (d) { d.nombre = archivo.nombre; d.tam = archivo.tam; d.version += 1; d.estado = "PENDIENTE"; d.obs = ""; d.fecha = new Date().toISOString(); }
    else tr.docs.push({ orden: Number(orden), nombre: archivo.nombre, tam: archivo.tam, estado: "PENDIENTE", obs: "", version: 1, fecha: new Date().toISOString() });
    guardar(); return true;
  }
  function registrarPago(exp, nroOp, fecha) {
    const tr = tramitePorExp(exp); if (!tr?.pago) return false;
    tr.pago.nroOp = nroOp; tr.pago.fecha = fecha; tr.pago.estado = "PENDIENTE"; guardar(); return true;
  }
  function validarPago(exp, ok, usr) {
    const tr = tramitePorExp(exp); if (!tr?.pago) return false;
    tr.pago.estado = ok ? "VALIDADO" : "RECHAZADO"; tr.pago.validador = usr; guardar(); return true;
  }

  function tramitesVisibles(u) {
    if (u.rol === "ADMINISTRADO") return S.tramites.filter((t) => t.usr === u.id);
    if (u.rol === "OFICINA") return S.tramites.filter((t) => t.oficina === u.oficina);
    if (u.rol === "MESA_PARTES") return S.tramites.filter((t) => t.estado <= 3 || t.estado === 4 || t.oficina === u.oficina);
    return S.tramites.slice();
  }

  /* ---------- estadísticas para reportes ---------- */
  function estadisticas(lista) {
    const porEstado = DEMO.estados.map((e) => ({ ...e, total: lista.filter((t) => t.estado === e.id).length }));
    const ofis = {};
    lista.forEach((t) => { const o = oficina(t.oficina); (ofis[o.id] ||= { oficina: o.nombre, sigla: o.sigla, recibidos: 0, atendidos: 0, pendientes: 0 }); ofis[o.id].recibidos++; (t.estado >= 7 ? ofis[o.id].atendidos++ : ofis[o.id].pendientes++); });
    const tiempos = {};
    lista.filter((t) => t.cierre).forEach((t) => { const p = procedimiento(t.proc); const dias = Math.max(0, Math.round((new Date(t.cierre) - new Date(t.registro)) / 864e5)); (tiempos[p.id] ||= { codigo: p.codigo, nombre: p.denominacion, plazo: p.plazo, n: 0, suma: 0 }); tiempos[p.id].n++; tiempos[p.id].suma += dias; });
    return {
      porEstado, porOficina: Object.values(ofis).sort((a, b) => b.recibidos - a.recibidos),
      tiempos: Object.values(tiempos).map((x) => ({ ...x, promedio: x.suma / x.n })).sort((a, b) => b.n - a.n),
    };
  }

  window.App = {
    TUPA, DEMO, estados: DEMO.estados, estadoPorId, esc, plano, fmtFecha, fmtFechaHora, fmtMonto, fmtTam, sumarHabiles, habilesHasta, $, $$, icono,
    procedimientos, procedimiento, procedimientoPorCodigo, oficina, oficinas: TUPA.oficinas, categorias: TUPA.categorias, categoriaPorId, sedes: TUPA.sedes,
    usuario, usuarioActual, nombreUsuario, costoTexto, ingresar, ingresarComo, salir, montar, toast, dialogo, insigniaEstado, etapas, plazoTexto,
    crearTramite, cambiarEstado, puedeCambiar, validarDocumento, subirDocumento, registrarPago, validarPago, tramitePorExp, tramitesVisibles, estadisticas, notificar, guardar, reiniciar,
    get estado() { return S; }, oficinaPorSigla, TRANSICIONES: DEMO.transiciones,
  };
})();
