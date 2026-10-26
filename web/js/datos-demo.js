/* Datos de demostración (FICTICIOS). Usuarios y trámites de ejemplo; el catálogo real está en datos-tupa.js.
   Contraseña de todas las cuentas: demo123 */
window.DEMO = {
  clave: "demo123",
  estados: [
    { id: 1, nombre: "Registrado",        color: "#6B7280", final: false },
    { id: 2, nombre: "Pendiente de pago", color: "#D97706", final: false },
    { id: 3, nombre: "En revisión",       color: "#2563EB", final: false },
    { id: 4, nombre: "Observado",         color: "#DC2626", final: false },
    { id: 5, nombre: "Derivado",          color: "#7C3AED", final: false },
    { id: 6, nombre: "En atención",       color: "#0891B2", final: false },
    { id: 7, nombre: "Resuelto",          color: "#16A34A", final: true },
    { id: 8, nombre: "Archivado",         color: "#374151", final: true },
  ],
  // Transiciones permitidas (máquina de estados del trámite)
  transiciones: {
    1: [2, 3], 2: [3], 3: [4, 5, 6, 7], 4: [3, 8], 5: [3, 4, 6], 6: [4, 5, 7], 7: [8], 8: [],
  },
  roles: {
    ADMINISTRADO:   "Administrado",
    MESA_PARTES:    "Mesa de partes",
    OFICINA:        "Oficina responsable",
    ADMINISTRADOR:  "Administrador",
  },
  usuarios: [
    { id: 1,  rol: "ADMINISTRADOR", oficina: null,       tipo: "personal",   dni: "10000001", nombres: "Admin",  apellidos: "Demo",            codigo: null,     correo: "admin@demo.unsaac.edu.pe",          telefono: "" },
    { id: 2,  rol: "MESA_PARTES",   oficina: "UTD",      tipo: "personal",   dni: "10000002", nombres: "Rosa",   apellidos: "Mamani Quispe",   codigo: null,     correo: "mesapartes@demo.unsaac.edu.pe",     telefono: "984000002" },
    { id: 3,  rol: "OFICINA",       oficina: "DECANATO", tipo: "personal",   dni: "10000003", nombres: "Carlos", apellidos: "Huamán Condori",  codigo: null,     correo: "decanato@demo.unsaac.edu.pe",       telefono: "984000003" },
    { id: 4,  rol: "OFICINA",       oficina: "DIR-CC",   tipo: "personal",   dni: "10000004", nombres: "Lucía",  apellidos: "Ccori Álvarez",   codigo: null,     correo: "centrocomputo@demo.unsaac.edu.pe",  telefono: "984000004" },
    { id: 5,  rol: "ADMINISTRADO",  oficina: null,       tipo: "estudiante", dni: "20000005", nombres: "Ana",    apellidos: "Quispe Mamani",   codigo: "200001", correo: "ana.quispe@demo.unsaac.edu.pe",     telefono: "984000005" },
    { id: 6,  rol: "ADMINISTRADO",  oficina: null,       tipo: "estudiante", dni: "20000006", nombres: "Luis",   apellidos: "Ttito Flores",    codigo: "210002", correo: "luis.ttito@demo.unsaac.edu.pe",     telefono: "984000006" },
    { id: 7,  rol: "ADMINISTRADO",  oficina: null,       tipo: "estudiante", dni: "20000007", nombres: "María",  apellidos: "Pumayalli Ccama", codigo: "220003", correo: "maria.pumayalli@demo.unsaac.edu.pe", telefono: "984000007" },
    { id: 8,  rol: "ADMINISTRADO",  oficina: null,       tipo: "egresado",   dni: "20000008", nombres: "Jorge",  apellidos: "Sullca Rojas",    codigo: "180004", correo: "jorge.sullca@demo.unsaac.edu.pe",   telefono: "984000008" },
    { id: 9,  rol: "ADMINISTRADO",  oficina: null,       tipo: "externo",    dni: "20000009", nombres: "Pedro",  apellidos: "Apaza Huillca",   codigo: null,     correo: "pedro.apaza@example.com",           telefono: "984000009" },
    { id: 10, rol: "OFICINA",       oficina: "RECTORADO",tipo: "personal",   dni: "10000010", nombres: "Elena",  apellidos: "Cusi Paucar",     codigo: null,     correo: "rectorado@demo.unsaac.edu.pe",      telefono: "984000010" },
  ],
  // Cuentas rápidas de la pantalla de acceso
  cuentasRapidas: [
    { id: 5, titulo: "Estudiante",           detalle: "Ana Quispe · registra y sigue sus trámites" },
    { id: 2, titulo: "Mesa de partes",       detalle: "Rosa Mamani · recibe y valida requisitos" },
    { id: 3, titulo: "Oficina responsable",  detalle: "Carlos Huamán · Decanato de la Facultad" },
    { id: 1, titulo: "Administrador",        detalle: "Reportes y mantenimiento del catálogo" },
  ],
  /* Trámites de ejemplo. dias = días atrás en que se registró.
     hist: [estado, sigla de la oficina (null = la misma), días después del registro, id de usuario, comentario] */
  tramites: [
    { exp: 1, usr: 5, nom: "Constancia de Estudios", asunto: "Constancia de estudios para solicitar beca", dias: 20, tarifa: 0, hist: [
      [1, null, 0, 5, "Trámite registrado por el administrado"], [2, null, 0, 2, "Pendiente el pago de S/ 15.00"],
      [3, null, 1, 2, "Pago validado, requisitos completos"], [5, "DECANATO", 1, 2, "Derivado al Decanato para su aprobación"],
      [6, null, 2, 3, "En elaboración de la constancia"], [7, null, 3, 3, "Constancia emitida, recoger en mesa de partes"] ] },
    { exp: 2, usr: 6, nom: "Certificado de Estudios", asunto: "Certificado de estudios de todos los semestres", dias: 12, tarifa: 0, hist: [
      [1, null, 0, 6, "Trámite registrado por el administrado"], [2, null, 0, 2, "Pendiente el pago de derechos de certificado"],
      [3, null, 1, 2, "Pago validado"], [4, null, 2, 2, "Las fotografías adjuntas no cumplen el tamaño carné a color"] ] },
    { exp: 3, usr: 7, nom: "Matrícula de Alumnos Regulares", asunto: "Matrícula del semestre 2026-II", dias: 9, tarifa: 1, hist: [
      [1, null, 0, 7, "Trámite registrado por el administrado"], [3, null, 0, 4, "Verificado: alumna regular y sin deudas"],
      [7, null, 1, 4, "Matrícula registrada"] ] },
    { exp: 4, usr: 8, nom: "Constancia de Créditos Acumulados o de Egresado", asunto: "Constancia de créditos para postulación a maestría", dias: 4, tarifa: 0, hist: [
      [1, null, 0, 8, "Trámite registrado por el administrado"], [2, null, 0, 4, "Pendiente el pago de S/ 12.00"] ] },
    { exp: 5, usr: 9, nom: "Admisión de Titulados o Graduados", asunto: "Inscripción para segunda profesión", dias: 7, tarifa: 0, hist: [
      [1, null, 0, 9, "Trámite registrado por el administrado"], [3, null, 1, 2, "Documentos recibidos, en revisión"],
      [5, "DECANATO", 1, 2, "Derivado al Decanato de la Facultad"], [6, null, 3, 3, "En evaluación por orden de mérito"] ] },
    { exp: 6, usr: 5, nom: "Recurso de Apelación", asunto: "Apelación contra resolución de convalidación", dias: 1, tarifa: 0, hist: [
      [1, null, 0, 5, "Trámite registrado por el administrado"] ] },
    { exp: 7, usr: 6, nom: "Constancia de Estudios", asunto: "Constancia de estudios para práctica pre profesional", dias: 15, tarifa: 0, hist: [
      [1, null, 0, 6, "Trámite registrado por el administrado"], [3, null, 0, 2, "Pago y requisitos validados"],
      [7, "DECANATO", 2, 3, "Constancia emitida"] ] },
    { exp: 8, usr: 5, nom: "Carta de Presentación de Decano", asunto: "Carta de presentación para prácticas pre profesionales", dias: 30, tarifa: 0, hist: [
      [1, null, 0, 5, "Trámite registrado por el administrado"], [3, null, 0, 2, "Requisitos completos"],
      [7, "DECANATO", 1, 3, "Carta emitida"], [8, null, 10, 2, "Archivado tras la entrega al administrado"] ] },
    { exp: 9, usr: 7, nom: "Constancia de Buena Conducta", asunto: "Constancia de buena conducta para beca de movilidad", dias: 6, tarifa: 0, hist: [
      [1, null, 0, 7, "Trámite registrado por el administrado"], [3, null, 1, 2, "En revisión de la ficha de seguimiento académico"] ] },
    { exp: 10, usr: 6, nom: "Convalidación de Asignaturas", asunto: "Convalidación de 4 asignaturas por traslado interno", dias: 10, tarifa: 0, hist: [
      [1, null, 0, 6, "Trámite registrado por el administrado"], [3, null, 1, 2, "Documentos completos"],
      [5, "DECANATO", 2, 2, "Derivado al Decanato para opinión"] ] },
    { exp: 11, usr: 7, nom: "Copia Visada de Sílabos", asunto: "Sílabos del plan de estudios 2019 para convalidación", dias: 3, tarifa: 0, hist: [
      [1, null, 0, 7, "Trámite registrado por el administrado"], [3, null, 1, 2, "En revisión"] ] },
    { exp: 12, usr: 8, nom: "Constancia de Estudios", asunto: "Constancia de estudios para trámite bancario", dias: 25, tarifa: 0, hist: [
      [1, null, 0, 8, "Trámite registrado por el administrado"], [3, null, 0, 2, "Requisitos completos"],
      [7, "DECANATO", 2, 3, "Constancia emitida"] ] },
    { exp: 13, usr: 5, nom: "Certificado de Estudios", asunto: "Certificado de estudios del primer al sexto semestre", dias: 22, tarifa: 0, hist: [
      [1, null, 0, 5, "Trámite registrado por el administrado"], [3, null, 1, 2, "Pago y requisitos validados"],
      [7, "DECANATO", 3, 3, "Certificado emitido"] ] },
    { exp: 14, usr: 7, nom: "Reserva de Matrícula", asunto: "Reserva de matrícula por el semestre 2026-II", dias: 18, tarifa: 0, hist: [
      [1, null, 0, 7, "Trámite registrado por el administrado"], [3, null, 1, 2, "Requisitos completos"],
      [5, "DECANATO", 2, 2, "Derivado al Decanato"], [7, null, 5, 3, "Reserva aprobada"] ] },
    { exp: 15, usr: 9, nom: "Recurso de Reconsideración", asunto: "Reconsideración del resultado de admisión", dias: 2, tarifa: 0, hist: [
      [1, null, 0, 9, "Trámite registrado por el administrado"], [3, null, 1, 2, "Escrito recibido"],
      [5, "RECTORADO", 1, 2, "Derivado al Rectorado"] ] },
  ],
};
