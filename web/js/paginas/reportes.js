/* Reportes: trámites por estado, por oficina y tiempos de atención */
App.montar({ pagina: "reportes", titulo: "Reportes", roles: ["MESA_PARTES", "OFICINA", "ADMINISTRADOR"] }, (main, u) => {
  const { esc, $, fmtFecha } = App;
  const lista = u.rol === "ADMINISTRADOR" || u.rol === "MESA_PARTES" ? App.estado.tramites : App.tramitesVisibles(u);
  const e = App.estadisticas(lista);
  function barras(datos, { ancho = 440, color = () => "#7A1424", etiqueta = (d) => d.nombre }) {
    const max = Math.max(1, ...datos.map((d) => d.total)), fila = 30, izq = 112, h = datos.length * fila + 10;
    return `<svg class="grafico" viewBox="0 0 ${ancho} ${h}" role="img" aria-label="Gráfico de barras: ${datos.map((d) => etiqueta(d) + " " + d.total).join(", ")}">${datos.map((d, i) => {
      const w = ((ancho - izq - 40) * d.total) / max;
      return `<text x="${izq - 8}" y="${i * fila + 20}" text-anchor="end" style="font-size:13px">${esc(etiqueta(d))}</text><rect x="${izq}" y="${i * fila + 5}" width="${Math.max(w, d.total ? 2 : 0)}" height="20" rx="3" fill="${color(d)}"/><text x="${izq + w + 6}" y="${i * fila + 20}" font-weight="700" style="font-size:13px">${d.total}</text>`; }).join("")}</svg>`;
  }
  const total = lista.length, resueltos = lista.filter((t) => t.estado >= 7).length;
  const venc = lista.filter((t) => t.estado < 7 && App.habilesHasta(t.limite) < 0).length;
  const prom = e.tiempos.length ? (e.tiempos.reduce((a, x) => a + x.suma, 0) / e.tiempos.reduce((a, x) => a + x.n, 0)).toFixed(1) : "—";
  main.innerHTML = `<div class="cabecera-pagina"><div><h1>Reportes</h1><p>${u.rol === "OFICINA" ? esc(App.oficina(u.oficina).nombre) : "Todas las oficinas"} · al ${fmtFecha(new Date().toISOString())}</p></div>
    <div class="fila no-imprimir"><button class="btn btn-sec" id="csv">Descargar CSV</button><button class="btn btn-plano" onclick="print()">Imprimir</button></div></div>
    <div class="kpis"><div class="kpi"><b>${total}</b><span>trámites registrados</span></div><div class="kpi" style="--c:#16A34A"><b>${total ? Math.round((resueltos / total) * 100) : 0}%</b><span>resueltos o archivados</span></div><div class="kpi" style="--c:#DC2626"><b>${venc}</b><span>con plazo vencido</span></div><div class="kpi" style="--c:#2563EB"><b>${prom}</b><span>días promedio de atención</span></div></div>
    <div class="rejilla dos">
      <section class="panel" style="margin-top:0"><h2>Trámites por estado</h2>${barras(e.porEstado, { color: (d) => d.color })}</section>
      <section class="panel" style="margin-top:0"><h2>Trámites por oficina</h2>${e.porOficina.length ? barras(e.porOficina.map((o) => ({ nombre: o.sigla, total: o.recibidos })), {}) : '<p class="suave">Sin datos.</p>'}
        <div class="leyenda"><span><i style="background:#7A1424"></i>Trámites recibidos</span></div></section></div>
    <section class="panel"><h2>Tiempo de atención frente al plazo del TUPA</h2>${e.tiempos.length ? `<div class="tabla-envoltura"><table class="tabla-resp"><thead><tr><th>Procedimiento</th><th class="num">Atendidos</th><th class="num">Promedio (días)</th><th class="num">Plazo TUPA (hábiles)</th></tr></thead><tbody>${e.tiempos.map((x) => `<tr><td data-label="Procedimiento">${esc(x.nombre)}</td><td class="num" data-label="Atendidos">${x.n}</td><td class="num" data-label="Promedio">${x.promedio.toFixed(1)}</td><td class="num" data-label="Plazo">${x.plazo}</td></tr>`).join("")}</tbody></table></div>` : '<div class="vacio"><strong>Aún no hay trámites resueltos</strong>Los tiempos aparecerán cuando se cierren trámites.</div>'}</section>
    <section class="panel"><h2>Detalle por oficina</h2><div class="tabla-envoltura"><table class="tabla-resp"><thead><tr><th>Oficina</th><th class="num">Recibidos</th><th class="num">Atendidos</th><th class="num">Pendientes</th></tr></thead><tbody>${e.porOficina.map((o) => `<tr><td data-label="Oficina">${esc(o.oficina)}</td><td class="num" data-label="Recibidos">${o.recibidos}</td><td class="num" data-label="Atendidos">${o.atendidos}</td><td class="num" data-label="Pendientes">${o.pendientes}</td></tr>`).join("")}</tbody></table></div></section>`;
  $("#csv").addEventListener("click", () => {
    const cab = ["Expediente", "Procedimiento", "Solicitante", "Estado", "Oficina", "Registro", "Límite"];
    const filas = lista.map((t) => [t.exp, App.procedimiento(t.proc).denominacion, App.nombreUsuario(App.usuario(t.usr)), App.estadoPorId[t.estado].nombre, App.oficina(t.oficina).sigla, t.registro.slice(0, 10), t.limite.slice(0, 10)]);
    const csv = "﻿" + [cab, ...filas].map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); a.download = "reporte-tramites.csv"; a.click(); App.toast("Reporte descargado.", "exito");
  });
});
