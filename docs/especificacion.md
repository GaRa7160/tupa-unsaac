# Especificación de requerimientos y casos de uso

## Requerimientos funcionales

| ID | Requerimiento | Pantalla | Prioridad |
|---|---|---|---|
| RF01 | Crear una cuenta de administrado validando DNI, celular, correo y contraseña | registro | Alta |
| RF02 | Ingresar con correo y contraseña, y cerrar sesión | index | Alta |
| RF03 | Consultar el catálogo del TUPA con búsqueda por texto y filtros por categoría, tipo y costo | catalogo | Alta |
| RF04 | Ver la ficha de un procedimiento con requisitos, costos, plazo, oficinas y recursos | procedimiento | Alta |
| RF05 | Registrar un trámite en 4 pasos (procedimiento, datos, documentos, pago) | nuevo-tramite | Alta |
| RF06 | Adjuntar documentos validando formato (PDF, ZIP, RAR, DOCX, XLSX) y tamaño (máx. 50 MB) | nuevo-tramite, tramite | Alta |
| RF07 | Registrar el pago con número de operación y fecha | nuevo-tramite, tramite | Alta |
| RF08 | Generar el número de expediente con formato AAAA-NNNNNN y calcular la fecha límite en días hábiles | nuevo-tramite | Alta |
| RF09 | Listar los trámites propios con filtros por estado y búsqueda | mis-tramites | Alta |
| RF10 | Mostrar el detalle del trámite con su ruta (historial de estados, oficina y comentario) | tramite | Alta |
| RF11 | Consultar un expediente por su número sin iniciar sesión | seguimiento | Alta |
| RF12 | Generar una notificación por cada cambio de estado y permitir marcarla como leída | notificaciones | Media |
| RF13 | Aprobar u observar cada documento adjunto | tramite | Alta |
| RF14 | Validar o rechazar el pago registrado | tramite | Alta |
| RF15 | Cambiar el estado del trámite solo con las transiciones permitidas | tramite | Alta |
| RF16 | Derivar el trámite a otra oficina | tramite | Alta |
| RF17 | Exigir un comentario al observar un trámite | tramite | Alta |
| RF18 | Permitir al administrado subir el documento corregido y reenviar el trámite a revisión | tramite | Alta |
| RF19 | Mostrar la bandeja de trámites con filtros por estado y plazo (vencidos, por vencer) | panel-oficina | Alta |
| RF20 | Emitir reportes por estado, por oficina y tiempos de atención frente al plazo del TUPA | reportes | Media |
| RF21 | Exportar el reporte a CSV e imprimirlo | reportes | Baja |
| RF22 | Editar plazo y vigencia de un procedimiento y agregar procedimientos nuevos | admin | Media |
| RF23 | Activar o desactivar cuentas de usuario | admin | Media |
| RF24 | Mostrar preguntas frecuentes y sedes, y permitir generar un ticket de ayuda | ayuda | Media |

## Requerimientos no funcionales

| ID | Categoría | Descripción |
|---|---|---|
| RNF01 | Usabilidad | Los errores indican qué ocurrió y cómo corregirlo; los listados vacíos indican qué hacer |
| RNF02 | Accesibilidad | Navegación por teclado, etiquetas en todos los campos, foco visible, contraste suficiente, aria-live en avisos y respeto a movimiento reducido |
| RNF03 | Diseño adaptable | Sin desplazamiento horizontal a 390 px de ancho; tablas que pasan a tarjetas |
| RNF04 | Rendimiento | El catálogo de 80 fichas se filtra en el navegador sin recargar la página |
| RNF05 | Seguridad | Control de acceso por rol en cada pantalla; contraseña de mínimo 8 caracteres con letras y números; en la segunda unidad se almacenará con hash |
| RNF06 | Integridad de datos | Claves foráneas, restricciones de tamaño de archivo y un estado de trámite solo cambia por transiciones permitidas |
| RNF07 | Compatibilidad | Probado en Chromium; HTML, CSS y JavaScript estándar sin librerías externas |
| RNF08 | Mantenibilidad | Código modular (núcleo común y un script por pantalla), versionado en Git con Pull Requests revisados |
| RNF09 | Fidelidad de la información | El catálogo proviene del TUPA vigente (CU-547-2025-UNSAAC) y se genera con un script a partir del PDF |
| RNF10 | Disponibilidad | Despliegue en servidor en la nube en la segunda unidad |

## Actores

| Actor | Descripción |
|---|---|
| Administrado | Estudiante, egresado, docente o persona externa que solicita un trámite |
| Mesa de partes | Personal que recibe el trámite y valida documentos y pagos |
| Oficina responsable | Personal de la oficina que atiende o deriva el trámite |
| Administrador | Personal que mantiene el catálogo y las cuentas y consulta reportes |
| Visitante | Persona sin sesión que consulta el TUPA o un expediente |

## Casos de uso

| ID | Caso de uso | Actores | Descripción | Requerimientos |
|---|---|---|---|---|
| CU01 | Consultar el TUPA | Visitante, Administrado | Busca y filtra procedimientos y abre la ficha con requisitos, costo y plazo | RF03, RF04 |
| CU02 | Crear cuenta e ingresar | Visitante | Se registra con sus datos validados e ingresa con correo y contraseña | RF01, RF02 |
| CU03 | Registrar un trámite | Administrado | Elige el procedimiento, completa datos, adjunta documentos, registra el pago y confirma; recibe su N.° de expediente | RF05 a RF08 |
| CU04 | Seguir un trámite | Administrado, Visitante | Ve la ruta del trámite, su estado y el plazo; el visitante lo hace con el N.° de expediente | RF09 a RF11 |
| CU05 | Recibir notificaciones | Administrado | Revisa los avisos de cada cambio de estado | RF12 |
| CU06 | Corregir un trámite observado | Administrado | Sube el documento corregido y reenvía a revisión | RF18 |
| CU07 | Validar documentos y pagos | Mesa de partes | Aprueba u observa cada documento y valida o rechaza el pago | RF13, RF14 |
| CU08 | Atender un trámite | Mesa de partes, Oficina | Cambia el estado, observa con comentario, deriva a otra oficina o resuelve | RF15 a RF17, RF19 |
| CU09 | Consultar reportes | Mesa de partes, Oficina, Administrador | Revisa los reportes y los exporta a CSV o imprime | RF20, RF21 |
| CU10 | Mantener el catálogo | Administrador | Edita plazo y vigencia o agrega un procedimiento | RF22 |
| CU11 | Gestionar usuarios | Administrador | Activa o desactiva cuentas | RF23 |
| CU12 | Pedir ayuda | Administrado, personal | Lee las preguntas frecuentes y genera un ticket | RF24 |

## Matriz de trazabilidad (pantalla, requerimientos y tablas)

| Pantalla | Requerimientos | Tablas de la BD |
|---|---|---|
| index.html | RF02 | usuarios, roles |
| registro.html | RF01 | usuarios, roles |
| inicio.html | RF09, RF19 | tramites, estados_tramite |
| catalogo.html | RF03 | procedimientos, categorias, tarifas_procedimiento |
| procedimiento.html | RF04 | procedimientos, requisitos_procedimiento, tarifas_procedimiento, recursos_procedimiento, procedimiento_presentacion, oficinas, sedes |
| nuevo-tramite.html | RF05 a RF08 | tramites, documentos, pagos, historial_tramite, notificaciones |
| mis-tramites.html | RF09 | tramites, estados_tramite, procedimientos |
| tramite.html | RF10, RF13 a RF18 | tramites, historial_tramite, documentos, pagos, estados_tramite, oficinas, notificaciones |
| seguimiento.html | RF11 | tramites, historial_tramite, estados_tramite, oficinas |
| notificaciones.html | RF12 | notificaciones |
| panel-oficina.html | RF19 | tramites, usuarios, oficinas, estados_tramite |
| reportes.html | RF20, RF21 | v_reporte_por_estado, v_reporte_por_oficina, v_tiempo_atencion |
| admin.html | RF22, RF23 | procedimientos, tarifas_procedimiento, usuarios |
| ayuda.html | RF24 | tickets_ayuda, sedes |
