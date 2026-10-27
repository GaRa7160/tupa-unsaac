-- =============================================================
-- Datos de demostración (FICTICIOS): usuarios, trámites, pagos, documentos y tickets.
-- Requiere haber cargado antes 01_schema.sql, 02_base.sql y 03_catalogo_tupa.sql.
-- =============================================================
USE tupa_unsaac;
SET NAMES utf8mb4;

-- Procedimientos y oficinas que usa la demostración (se buscan por código y sigla)
SET @p_adm_titulados  = (SELECT id_procedimiento FROM procedimientos WHERE codigo = 'PA51000A49');
SET @p_apelacion      = (SELECT id_procedimiento FROM procedimientos WHERE codigo = 'PA51007450');
SET @p_matricula      = (SELECT id_procedimiento FROM procedimientos WHERE codigo = 'SE5100DB61');
SET @p_certificado    = (SELECT id_procedimiento FROM procedimientos WHERE codigo = 'SE51004D55');
SET @p_const_estudios = (SELECT id_procedimiento FROM procedimientos WHERE codigo = 'SE51008F61');
SET @p_const_creditos = (SELECT id_procedimiento FROM procedimientos WHERE codigo = 'SE5100B580');
SET @o_utd      = (SELECT id_oficina FROM oficinas WHERE sigla = 'UTD');
SET @o_decanato = (SELECT id_oficina FROM oficinas WHERE sigla = 'DECANATO');
SET @o_dir_cc   = (SELECT id_oficina FROM oficinas WHERE sigla = 'DIR-CC');
SET @o_mpf      = (SELECT id_oficina FROM oficinas WHERE sigla = 'MPF');

-- -------------------------------------------------------------
-- Usuarios ficticios (el hash es un marcador, no una contraseña real)
-- -------------------------------------------------------------
SET @hash = '$2y$10$MARCADOR.DE.EJEMPLO.NO.USAR.EN.PRODUCCION.xxxxxxxxxxxxxxxxxxxx';

INSERT INTO usuarios
 (id_usuario, id_rol, id_oficina, tipo_usuario, dni, nombres, apellidos, codigo_estudiante, correo, telefono, password_hash) VALUES
 (1, 4, NULL, 'personal',   '10000001', 'Admin',  'Demo',                 NULL,     'admin@demo.unsaac.edu.pe',   NULL,        @hash),
 (2, 2, @o_utd,      'personal',   '10000002', 'Rosa',   'Mamani Quispe',        NULL,     'mesapartes@demo.unsaac.edu.pe', '984000002', @hash),
 (3, 3, @o_decanato, 'personal',   '10000003', 'Carlos', 'Huamán Condori',       NULL,     'decanato@demo.unsaac.edu.pe',   '984000003', @hash),
 (4, 3, @o_dir_cc,   'personal',   '10000004', 'Lucía',  'Ccori Álvarez',        NULL,     'centrocomputo@demo.unsaac.edu.pe', '984000004', @hash),
 (5, 1, NULL, 'estudiante', '20000005', 'Ana',    'Quispe Mamani',        '200001', 'ana.quispe@demo.unsaac.edu.pe', '984000005', @hash),
 (6, 1, NULL, 'estudiante', '20000006', 'Luis',   'Ttito Flores',         '210002', 'luis.ttito@demo.unsaac.edu.pe', '984000006', @hash),
 (7, 1, NULL, 'estudiante', '20000007', 'María',  'Pumayalli Ccama',      '220003', 'maria.pumayalli@demo.unsaac.edu.pe', '984000007', @hash),
 (8, 1, NULL, 'egresado',   '20000008', 'Jorge',  'Sullca Rojas',         '180004', 'jorge.sullca@demo.unsaac.edu.pe', '984000008', @hash),
 (9, 1, NULL, 'externo',    '20000009', 'Pedro',  'Apaza Huillca',        NULL,     'pedro.apaza@example.com',        '984000009', @hash);

-- -------------------------------------------------------------
-- Trámites de demostración (usan los procedimientos almacenados)
-- -------------------------------------------------------------
-- T1 Ana: Constancia de estudios -> resuelta
CALL sp_registrar_tramite(5, @p_const_estudios, 'Constancia de estudios para solicitar beca', '984000005', 'ana.quispe@demo.unsaac.edu.pe', @t1);
CALL sp_cambiar_estado_tramite(@t1, 2, NULL, 2, 'Pendiente el pago de S/ 15.00 en caja');
CALL sp_cambiar_estado_tramite(@t1, 3, NULL, 2, 'Pago validado, requisitos completos');
CALL sp_cambiar_estado_tramite(@t1, 5, @o_decanato,    2, 'Derivado al Decanato para su aprobación');
CALL sp_cambiar_estado_tramite(@t1, 6, NULL, 3, 'En elaboración de la constancia');
CALL sp_cambiar_estado_tramite(@t1, 7, NULL, 3, 'Constancia emitida, recoger en mesa de partes');

-- T2 Luis: Certificado de estudios -> observado (fotografías)
CALL sp_registrar_tramite(6, @p_certificado, 'Certificado de estudios de todos los semestres', '984000006', 'luis.ttito@demo.unsaac.edu.pe', @t2);
CALL sp_cambiar_estado_tramite(@t2, 2, NULL, 2, 'Pendiente el pago de derechos de certificado');
CALL sp_cambiar_estado_tramite(@t2, 3, NULL, 2, 'Pago validado');
CALL sp_cambiar_estado_tramite(@t2, 4, NULL, 2, 'Las fotografías adjuntas no cumplen el tamaño carné a color');

-- T3 María: Matrícula -> resuelta
CALL sp_registrar_tramite(7, @p_matricula, 'Matrícula del semestre 2026-II', '984000007', 'maria.pumayalli@demo.unsaac.edu.pe', @t3);
CALL sp_cambiar_estado_tramite(@t3, 3, NULL, 4, 'Verificado: alumna regular y sin deudas');
CALL sp_cambiar_estado_tramite(@t3, 7, NULL, 4, 'Matrícula registrada');

-- T4 Jorge: Constancia de créditos -> pendiente de pago
CALL sp_registrar_tramite(8, @p_const_creditos, 'Constancia de créditos acumulados para postulación', '984000008', 'jorge.sullca@demo.unsaac.edu.pe', @t4);
CALL sp_cambiar_estado_tramite(@t4, 2, NULL, 4, 'Pendiente el pago de S/ 12.00');

-- T5 Pedro: Admisión de titulados -> en atención en el Decanato
CALL sp_registrar_tramite(9, @p_adm_titulados, 'Inscripción para segunda profesión', '984000009', 'pedro.apaza@example.com', @t5);
CALL sp_cambiar_estado_tramite(@t5, 3, NULL, 2, 'Documentos recibidos, en revisión');
CALL sp_cambiar_estado_tramite(@t5, 5, @o_decanato,    2, 'Derivado al Decanato de la Facultad');
CALL sp_cambiar_estado_tramite(@t5, 6, NULL, 3, 'En evaluación por orden de mérito');

-- T6 Ana: Recurso de apelación -> registrado
CALL sp_registrar_tramite(5, @p_apelacion, 'Apelación contra resolución de convalidación', '984000005', 'ana.quispe@demo.unsaac.edu.pe', @t6);

-- T7 Luis: Constancia de estudios -> resuelta
CALL sp_registrar_tramite(6, @p_const_estudios, 'Constancia de estudios para práctica pre profesional', '984000006', 'luis.ttito@demo.unsaac.edu.pe', @t7);
CALL sp_cambiar_estado_tramite(@t7, 3, NULL, 2, 'Pago y requisitos validados');
CALL sp_cambiar_estado_tramite(@t7, 7, NULL, 3, 'Constancia emitida');

-- Pagos
INSERT INTO pagos (id_tramite, id_tarifa, monto, nro_operacion, fecha_pago, estado, id_validador)
SELECT @t1, id_tarifa, monto, 'OP-583201', CURDATE(), 'VALIDADO', 2 FROM tarifas_procedimiento WHERE id_procedimiento = @p_const_estudios;
INSERT INTO pagos (id_tramite, id_tarifa, monto, nro_operacion, fecha_pago, estado, id_validador)
SELECT @t2, id_tarifa, monto, 'OP-583377', CURDATE(), 'VALIDADO', 2 FROM tarifas_procedimiento WHERE id_procedimiento = @p_certificado AND monto = 9.00;
INSERT INTO pagos (id_tramite, id_tarifa, monto, estado)
SELECT @t4, id_tarifa, monto, 'PENDIENTE' FROM tarifas_procedimiento WHERE id_procedimiento = @p_const_creditos;
INSERT INTO pagos (id_tramite, id_tarifa, monto, nro_operacion, fecha_pago, estado, id_validador)
SELECT @t5, id_tarifa, monto, 'OP-584010', CURDATE(), 'VALIDADO', 2 FROM tarifas_procedimiento WHERE id_procedimiento = @p_adm_titulados;

-- Documentos adjuntos (el T2 tiene una observación pendiente de subsanar)
INSERT INTO documentos
 (id_tramite, id_requisito, nombre_original, ruta_archivo, tipo_mime, tamano_bytes, version, estado, observacion, id_validador, validado_en)
VALUES
 (@t1, (SELECT id_requisito FROM requisitos_procedimiento WHERE id_procedimiento = @p_const_estudios AND orden = 1), 'solicitud.pdf',
  'uploads/2026/t1/solicitud.pdf', 'application/pdf', 182340, 1, 'APROBADO', NULL, 2, NOW()),
 (@t1, (SELECT id_requisito FROM requisitos_procedimiento WHERE id_procedimiento = @p_const_estudios AND orden = 2), 'constancia-matricula.pdf',
  'uploads/2026/t1/constancia-matricula.pdf', 'application/pdf', 254110, 1, 'APROBADO', NULL, 2, NOW()),
 (@t2, (SELECT id_requisito FROM requisitos_procedimiento WHERE id_procedimiento = @p_certificado AND orden = 2), 'fotos.zip',
  'uploads/2026/t2/fotos.zip', 'application/zip', 1048576, 1, 'OBSERVADO', 'Las fotografías deben ser tamaño carné a color', 2, NOW()),
 (@t2, (SELECT id_requisito FROM requisitos_procedimiento WHERE id_procedimiento = @p_certificado AND orden = 3), 'ficha-seguimiento.pdf',
  'uploads/2026/t2/ficha-seguimiento.pdf', 'application/pdf', 310200, 1, 'APROBADO', NULL, 2, NOW()),
 (@t5, (SELECT id_requisito FROM requisitos_procedimiento WHERE id_procedimiento = @p_adm_titulados AND orden = 3), 'titulo-profesional.pdf',
  'uploads/2026/t5/titulo-profesional.pdf', 'application/pdf', 905600, 1, 'APROBADO', NULL, 2, NOW());

-- Un ticket de ayuda ligado a un trámite
INSERT INTO tickets_ayuda (id_usuario, id_tramite, id_oficina, asunto, observacion, estado)
VALUES (6, @t2, @o_mpf, 'No puedo subir las fotografías', 'El sistema rechaza el archivo .zip de 1 MB', 'PENDIENTE');

-- Se marcan como leídas las notificaciones antiguas de los trámites cerrados
UPDATE notificaciones SET leida = 1 WHERE id_tramite IN (@t1, @t3, @t7);

-- -------------------------------------------------------------
-- Se reparten las fechas en las últimas semanas para que los reportes tengan sentido
-- -------------------------------------------------------------
CREATE TEMPORARY TABLE tmp_desfase (id_tramite BIGINT UNSIGNED, dias_atras INT, dias_cierre INT);
INSERT INTO tmp_desfase VALUES (@t1, 20, 2), (@t2, 12, NULL), (@t3, 9, 1),
                               (@t4, 4, NULL), (@t5, 7, NULL), (@t6, 1, NULL), (@t7, 15, 3);

-- Primero fecha límite y cierre (leen la fecha de registro original)...
UPDATE tramites t
  JOIN tmp_desfase d ON d.id_tramite = t.id_tramite
  JOIN procedimientos p ON p.id_procedimiento = t.id_procedimiento
   SET t.fecha_limite = fn_sumar_dias_habiles(DATE(DATE_SUB(t.fecha_registro, INTERVAL d.dias_atras DAY)), p.plazo_dias_habiles),
       t.fecha_cierre = IF(t.fecha_cierre IS NULL, NULL,
                           DATE_ADD(DATE_SUB(t.fecha_registro, INTERVAL d.dias_atras DAY), INTERVAL d.dias_cierre DAY));
-- ...y después la propia fecha de registro.
UPDATE tramites t
  JOIN tmp_desfase d ON d.id_tramite = t.id_tramite
   SET t.fecha_registro = DATE_SUB(t.fecha_registro, INTERVAL d.dias_atras DAY);

UPDATE historial_tramite h JOIN tmp_desfase d ON d.id_tramite = h.id_tramite
   SET h.fecha = DATE_SUB(h.fecha, INTERVAL d.dias_atras DAY);
UPDATE notificaciones n JOIN tmp_desfase d ON d.id_tramite = n.id_tramite
   SET n.creada_en = DATE_SUB(n.creada_en, INTERVAL d.dias_atras DAY);

DROP TEMPORARY TABLE tmp_desfase;
