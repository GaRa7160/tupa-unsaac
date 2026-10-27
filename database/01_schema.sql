-- =============================================================
-- Plataforma Web para la Optimización de la Gestión del TUPA de la UNSAAC
-- Desarrollo de Software I - Proyecto Semestral 2026-2
-- Base de datos: tupa_unsaac  (MySQL 8 / MariaDB 10.4+)
-- Entrega 2: diseño de la base de datos
-- =============================================================

DROP DATABASE IF EXISTS tupa_unsaac;
CREATE DATABASE tupa_unsaac
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE tupa_unsaac;

-- -------------------------------------------------------------
-- M1. ACCESO Y ORGANIZACIÓN
-- -------------------------------------------------------------

CREATE TABLE roles (
  id_rol       TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre       VARCHAR(30)  NOT NULL,
  descripcion  VARCHAR(150) NOT NULL,
  PRIMARY KEY (id_rol),
  UNIQUE KEY uq_roles_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE sedes (
  id_sede     TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre      VARCHAR(80)  NOT NULL,
  direccion   VARCHAR(160) NOT NULL,
  horario     VARCHAR(80)  NOT NULL,
  es_filial   TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (id_sede),
  UNIQUE KEY uq_sedes_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE oficinas (
  id_oficina  SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_sede     TINYINT UNSIGNED  NOT NULL,
  nombre      VARCHAR(120) NOT NULL,
  sigla       VARCHAR(15)  NOT NULL,
  telefono    VARCHAR(30)  NULL,
  correo      VARCHAR(120) NULL,
  activa      TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id_oficina),
  UNIQUE KEY uq_oficinas_sigla (sigla),
  CONSTRAINT fk_oficinas_sede FOREIGN KEY (id_sede) REFERENCES sedes (id_sede)
) ENGINE=InnoDB;

CREATE TABLE usuarios (
  id_usuario         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_rol             TINYINT UNSIGNED  NOT NULL,
  id_oficina         SMALLINT UNSIGNED NULL COMMENT 'Solo para personal de oficinas',
  tipo_usuario       ENUM('estudiante','egresado','externo','personal') NOT NULL,
  dni                CHAR(8)      NOT NULL,
  nombres            VARCHAR(80)  NOT NULL,
  apellidos          VARCHAR(80)  NOT NULL,
  codigo_estudiante  VARCHAR(10)  NULL,
  correo             VARCHAR(120) NOT NULL,
  telefono           VARCHAR(15)  NULL,
  password_hash      VARCHAR(255) NULL COMMENT 'NULL si ingresa solo con Google',
  google_id          VARCHAR(60)  NULL,
  activo             TINYINT(1)   NOT NULL DEFAULT 1,
  creado_en          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_usuario),
  UNIQUE KEY uq_usuarios_dni (dni),
  UNIQUE KEY uq_usuarios_correo (correo),
  UNIQUE KEY uq_usuarios_codigo (codigo_estudiante),
  CONSTRAINT fk_usuarios_rol     FOREIGN KEY (id_rol)     REFERENCES roles (id_rol),
  CONSTRAINT fk_usuarios_oficina FOREIGN KEY (id_oficina) REFERENCES oficinas (id_oficina)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- M2. CATÁLOGO TUPA
-- -------------------------------------------------------------

CREATE TABLE categorias (
  id_categoria  TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre        VARCHAR(80) NOT NULL,
  PRIMARY KEY (id_categoria),
  UNIQUE KEY uq_categorias_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE procedimientos (
  id_procedimiento         SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  codigo                   VARCHAR(15)  NOT NULL COMMENT 'Código TUPA, ej. PA51000A49',
  id_categoria             TINYINT UNSIGNED  NOT NULL,
  seccion                  ENUM('PROCEDIMIENTO_ADMINISTRATIVO','SERVICIO_EXCLUSIVO') NOT NULL,
  denominacion             VARCHAR(200) NOT NULL,
  descripcion              TEXT         NOT NULL,
  canal_atencion           VARCHAR(500) NOT NULL DEFAULT 'Atención presencial: Av. De la Cultura N° 733, Unidad de Trámite Documentario y Comunicaciones',
  modalidad_pago           VARCHAR(80)  NULL COMMENT 'NULL si es gratuito',
  plazo_dias_habiles       TINYINT UNSIGNED NOT NULL,
  calificacion             ENUM('SILENCIO_POSITIVO','SILENCIO_NEGATIVO','NO_APLICA') NOT NULL DEFAULT 'NO_APLICA',
  id_oficina_presentacion  SMALLINT UNSIGNED NOT NULL COMMENT 'Oficina principal donde se presenta (la primera del TUPA); ver procedimiento_presentacion',
  id_oficina_responsable   SMALLINT UNSIGNED NOT NULL COMMENT 'Quien aprueba la solicitud',
  notas                    VARCHAR(600) NULL COMMENT 'Notas de la ficha del TUPA',
  norma_aprobacion         VARCHAR(40)  NOT NULL DEFAULT 'CU-547-2025-UNSAAC',
  vigente                  TINYINT(1)   NOT NULL DEFAULT 1,
  actualizado_en           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_procedimiento),
  UNIQUE KEY uq_procedimientos_codigo (codigo),
  KEY ix_procedimientos_categoria (id_categoria),
  KEY ix_procedimientos_responsable (id_oficina_responsable),
  FULLTEXT KEY ft_procedimientos (denominacion, descripcion),
  CONSTRAINT fk_proc_categoria    FOREIGN KEY (id_categoria)            REFERENCES categorias (id_categoria),
  CONSTRAINT fk_proc_presentacion FOREIGN KEY (id_oficina_presentacion) REFERENCES oficinas (id_oficina),
  CONSTRAINT fk_proc_responsable  FOREIGN KEY (id_oficina_responsable)  REFERENCES oficinas (id_oficina)
) ENGINE=InnoDB;

-- Un procedimiento puede presentarse en varias oficinas (ej. Mesa de Partes o Secretaría de cada filial)
CREATE TABLE procedimiento_presentacion (
  id_procedimiento  SMALLINT UNSIGNED NOT NULL,
  id_oficina        SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (id_procedimiento, id_oficina),
  CONSTRAINT fk_pp_proc    FOREIGN KEY (id_procedimiento) REFERENCES procedimientos (id_procedimiento) ON DELETE CASCADE,
  CONSTRAINT fk_pp_oficina FOREIGN KEY (id_oficina)       REFERENCES oficinas (id_oficina)
) ENGINE=InnoDB;

-- Un procedimiento puede tener varias tarifas (ej. Matrícula: escalas A, B y C).
-- Gratuito = tarifa con monto 0.00
CREATE TABLE tarifas_procedimiento (
  id_tarifa         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_procedimiento  SMALLINT UNSIGNED NOT NULL,
  concepto          VARCHAR(400) NOT NULL,
  monto             DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id_tarifa),
  KEY ix_tarifas_procedimiento (id_procedimiento),
  CONSTRAINT ck_tarifas_monto CHECK (monto >= 0),
  CONSTRAINT fk_tarifas_proc FOREIGN KEY (id_procedimiento) REFERENCES procedimientos (id_procedimiento)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- tipo: DOCUMENTO = el administrado lo adjunta; PAGO = se cubre con el pago;
--       CONDICION = lo verifica la oficina (ej. "no ser deudor")
CREATE TABLE requisitos_procedimiento (
  id_requisito      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_procedimiento  SMALLINT UNSIGNED NOT NULL,
  orden             TINYINT UNSIGNED NOT NULL,
  descripcion       TEXT NOT NULL,
  tipo              ENUM('DOCUMENTO','PAGO','CONDICION') NOT NULL DEFAULT 'DOCUMENTO',
  obligatorio       TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id_requisito),
  UNIQUE KEY uq_requisito_orden (id_procedimiento, orden),
  CONSTRAINT fk_req_proc FOREIGN KEY (id_procedimiento) REFERENCES procedimientos (id_procedimiento)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- Instancias de reconsideración y apelación de cada procedimiento
CREATE TABLE recursos_procedimiento (
  id_procedimiento         SMALLINT UNSIGNED NOT NULL,
  tipo                     ENUM('RECONSIDERACION','APELACION') NOT NULL,
  autoridad                VARCHAR(120) NOT NULL,
  plazo_presentacion_dias  TINYINT UNSIGNED NOT NULL,
  plazo_respuesta_dias     TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (id_procedimiento, tipo),
  CONSTRAINT fk_recursos_proc FOREIGN KEY (id_procedimiento) REFERENCES procedimientos (id_procedimiento)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- M3, M4, M7. TRÁMITES, SEGUIMIENTO Y PANEL DE OFICINAS
-- -------------------------------------------------------------

CREATE TABLE estados_tramite (
  id_estado  TINYINT UNSIGNED NOT NULL,
  nombre     VARCHAR(30) NOT NULL,
  orden      TINYINT UNSIGNED NOT NULL,
  es_final   TINYINT(1) NOT NULL DEFAULT 0,
  color      CHAR(7) NOT NULL COMMENT 'Color de la etiqueta en la interfaz',
  PRIMARY KEY (id_estado),
  UNIQUE KEY uq_estados_nombre (nombre)
) ENGINE=InnoDB;

CREATE TABLE tramites (
  id_tramite          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nro_expediente      VARCHAR(12) NOT NULL COMMENT 'AAAA-NNNNNN',
  id_usuario          INT UNSIGNED NOT NULL,
  id_procedimiento    SMALLINT UNSIGNED NOT NULL,
  id_estado           TINYINT UNSIGNED NOT NULL,
  id_oficina_actual   SMALLINT UNSIGNED NOT NULL,
  asunto              VARCHAR(250) NOT NULL,
  telefono_contacto   VARCHAR(15)  NULL,
  correo_contacto     VARCHAR(120) NOT NULL,
  fecha_registro      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_limite        DATE NULL COMMENT 'Registro + plazo en días hábiles',
  fecha_cierre        DATETIME NULL,
  PRIMARY KEY (id_tramite),
  UNIQUE KEY uq_tramites_expediente (nro_expediente),
  KEY ix_tramites_usuario (id_usuario, fecha_registro),
  KEY ix_tramites_estado (id_estado),
  KEY ix_tramites_oficina (id_oficina_actual, id_estado),
  CONSTRAINT fk_tramites_usuario FOREIGN KEY (id_usuario)        REFERENCES usuarios (id_usuario),
  CONSTRAINT fk_tramites_proc    FOREIGN KEY (id_procedimiento)  REFERENCES procedimientos (id_procedimiento),
  CONSTRAINT fk_tramites_estado  FOREIGN KEY (id_estado)         REFERENCES estados_tramite (id_estado),
  CONSTRAINT fk_tramites_oficina FOREIGN KEY (id_oficina_actual) REFERENCES oficinas (id_oficina)
) ENGINE=InnoDB;

-- Línea de tiempo del seguimiento: un registro por cada cambio de estado o derivación
CREATE TABLE historial_tramite (
  id_historial        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_tramite          BIGINT UNSIGNED NOT NULL,
  id_estado           TINYINT UNSIGNED NOT NULL,
  id_oficina_origen   SMALLINT UNSIGNED NULL,
  id_oficina_destino  SMALLINT UNSIGNED NULL,
  id_usuario          INT UNSIGNED NOT NULL COMMENT 'Quien realizó la acción',
  comentario          VARCHAR(400) NULL,
  fecha               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_historial),
  KEY ix_historial_tramite (id_tramite, fecha),
  CONSTRAINT fk_hist_tramite FOREIGN KEY (id_tramite) REFERENCES tramites (id_tramite) ON DELETE CASCADE,
  CONSTRAINT fk_hist_estado  FOREIGN KEY (id_estado)  REFERENCES estados_tramite (id_estado),
  CONSTRAINT fk_hist_origen  FOREIGN KEY (id_oficina_origen)  REFERENCES oficinas (id_oficina),
  CONSTRAINT fk_hist_destino FOREIGN KEY (id_oficina_destino) REFERENCES oficinas (id_oficina),
  CONSTRAINT fk_hist_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- M6. DOCUMENTOS DIGITALES Y PAGOS
-- -------------------------------------------------------------

CREATE TABLE documentos (
  id_documento     BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_tramite       BIGINT UNSIGNED NOT NULL,
  id_requisito     INT UNSIGNED NULL COMMENT 'Requisito que cubre; NULL si es adjunto adicional',
  nombre_original  VARCHAR(200) NOT NULL,
  ruta_archivo     VARCHAR(300) NOT NULL,
  tipo_mime        VARCHAR(80)  NOT NULL,
  tamano_bytes     INT UNSIGNED NOT NULL,
  version          TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Sube de 1 en 1 al subsanar una observación',
  estado           ENUM('PENDIENTE','APROBADO','OBSERVADO') NOT NULL DEFAULT 'PENDIENTE',
  observacion      VARCHAR(400) NULL,
  id_validador     INT UNSIGNED NULL,
  subido_en        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  validado_en      DATETIME NULL,
  PRIMARY KEY (id_documento),
  KEY ix_documentos_tramite (id_tramite),
  CONSTRAINT ck_documentos_tamano CHECK (tamano_bytes <= 52428800),  -- 50 MB, como en Pladdes
  CONSTRAINT fk_doc_tramite   FOREIGN KEY (id_tramite)    REFERENCES tramites (id_tramite) ON DELETE CASCADE,
  CONSTRAINT fk_doc_requisito FOREIGN KEY (id_requisito)  REFERENCES requisitos_procedimiento (id_requisito),
  CONSTRAINT fk_doc_validador FOREIGN KEY (id_validador)  REFERENCES usuarios (id_usuario)
) ENGINE=InnoDB;

CREATE TABLE pagos (
  id_pago           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_tramite        BIGINT UNSIGNED NOT NULL,
  id_tarifa         INT UNSIGNED NOT NULL,
  monto             DECIMAL(10,2) NOT NULL,
  nro_operacion     VARCHAR(30) NULL,
  fecha_pago        DATE NULL,
  comprobante_ruta  VARCHAR(300) NULL,
  estado            ENUM('PENDIENTE','VALIDADO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  id_validador      INT UNSIGNED NULL,
  registrado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_pago),
  KEY ix_pagos_tramite (id_tramite),
  CONSTRAINT ck_pagos_monto CHECK (monto >= 0),
  CONSTRAINT fk_pago_tramite   FOREIGN KEY (id_tramite)   REFERENCES tramites (id_tramite) ON DELETE CASCADE,
  CONSTRAINT fk_pago_tarifa    FOREIGN KEY (id_tarifa)    REFERENCES tarifas_procedimiento (id_tarifa),
  CONSTRAINT fk_pago_validador FOREIGN KEY (id_validador) REFERENCES usuarios (id_usuario)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- M5. NOTIFICACIONES Y AYUDA
-- -------------------------------------------------------------

CREATE TABLE notificaciones (
  id_notificacion  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario       INT UNSIGNED NOT NULL,
  id_tramite       BIGINT UNSIGNED NULL,
  titulo           VARCHAR(120) NOT NULL,
  mensaje          VARCHAR(400) NOT NULL,
  canal            ENUM('PLATAFORMA','CORREO') NOT NULL DEFAULT 'PLATAFORMA',
  leida            TINYINT(1) NOT NULL DEFAULT 0,
  creada_en        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_notificacion),
  KEY ix_notif_usuario (id_usuario, leida, creada_en),
  CONSTRAINT fk_notif_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario),
  CONSTRAINT fk_notif_tramite FOREIGN KEY (id_tramite) REFERENCES tramites (id_tramite) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Soporte, ligado opcionalmente a un trámite (en Pladdes el ticket es genérico)
CREATE TABLE tickets_ayuda (
  id_ticket     INT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_usuario    INT UNSIGNED NOT NULL,
  id_tramite    BIGINT UNSIGNED NULL,
  id_oficina    SMALLINT UNSIGNED NULL,
  asunto        VARCHAR(150) NOT NULL,
  observacion   VARCHAR(500) NULL,
  imagen_ruta   VARCHAR(300) NULL,
  estado        ENUM('PENDIENTE','EN_PROCESO','ATENDIDO') NOT NULL DEFAULT 'PENDIENTE',
  creado_en     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atendido_en   DATETIME NULL,
  PRIMARY KEY (id_ticket),
  KEY ix_tickets_usuario (id_usuario),
  CONSTRAINT fk_ticket_usuario FOREIGN KEY (id_usuario) REFERENCES usuarios (id_usuario),
  CONSTRAINT fk_ticket_tramite FOREIGN KEY (id_tramite) REFERENCES tramites (id_tramite) ON DELETE SET NULL,
  CONSTRAINT fk_ticket_oficina FOREIGN KEY (id_oficina) REFERENCES oficinas (id_oficina)
) ENGINE=InnoDB;

-- -------------------------------------------------------------
-- LÓGICA DE NEGOCIO
-- -------------------------------------------------------------

DELIMITER $$

-- Suma días hábiles (lunes a viernes) a una fecha. No considera feriados.
CREATE FUNCTION fn_sumar_dias_habiles(p_fecha DATE, p_dias INT)
RETURNS DATE
DETERMINISTIC
BEGIN
  DECLARE v_fecha DATE DEFAULT p_fecha;
  DECLARE v_resto INT DEFAULT p_dias;
  WHILE v_resto > 0 DO
    SET v_fecha = DATE_ADD(v_fecha, INTERVAL 1 DAY);
    IF WEEKDAY(v_fecha) < 5 THEN
      SET v_resto = v_resto - 1;
    END IF;
  END WHILE;
  RETURN v_fecha;
END$$

-- Registra un trámite: genera el N° de expediente, calcula la fecha límite,
-- deja el trámite en "Registrado", abre la línea de tiempo y notifica al usuario.
CREATE PROCEDURE sp_registrar_tramite(
  IN  p_id_usuario       INT UNSIGNED,
  IN  p_id_procedimiento SMALLINT UNSIGNED,
  IN  p_asunto           VARCHAR(250),
  IN  p_telefono         VARCHAR(15),
  IN  p_correo           VARCHAR(120),
  OUT p_id_tramite       BIGINT UNSIGNED
)
BEGIN
  DECLARE v_oficina SMALLINT UNSIGNED;
  DECLARE v_plazo   TINYINT UNSIGNED;
  DECLARE v_nro     VARCHAR(12);
  DECLARE v_siguiente INT;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SELECT id_oficina_presentacion, plazo_dias_habiles
    INTO v_oficina, v_plazo
    FROM procedimientos
   WHERE id_procedimiento = p_id_procedimiento AND vigente = 1;

  IF v_oficina IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Procedimiento inexistente o no vigente';
  END IF;

  START TRANSACTION;

  SELECT COALESCE(MAX(CAST(SUBSTRING(nro_expediente, 6) AS UNSIGNED)), 0) + 1
    INTO v_siguiente
    FROM tramites
   WHERE nro_expediente LIKE CONCAT(YEAR(CURDATE()), '-%')
   FOR UPDATE;

  SET v_nro = CONCAT(YEAR(CURDATE()), '-', LPAD(v_siguiente, 6, '0'));

  INSERT INTO tramites
    (nro_expediente, id_usuario, id_procedimiento, id_estado, id_oficina_actual,
     asunto, telefono_contacto, correo_contacto, fecha_limite)
  VALUES
    (v_nro, p_id_usuario, p_id_procedimiento, 1, v_oficina,
     p_asunto, p_telefono, p_correo, fn_sumar_dias_habiles(CURDATE(), v_plazo));

  SET p_id_tramite = LAST_INSERT_ID();

  INSERT INTO historial_tramite (id_tramite, id_estado, id_oficina_destino, id_usuario, comentario)
  VALUES (p_id_tramite, 1, v_oficina, p_id_usuario, 'Trámite registrado por el administrado');

  INSERT INTO notificaciones (id_usuario, id_tramite, titulo, mensaje)
  VALUES (p_id_usuario, p_id_tramite, 'Trámite registrado',
          CONCAT('Tu trámite ', v_nro, ' fue registrado correctamente.'));

  COMMIT;
END$$

-- Cambia el estado de un trámite (y opcionalmente lo deriva a otra oficina),
-- deja rastro en la línea de tiempo y notifica al administrado.
CREATE PROCEDURE sp_cambiar_estado_tramite(
  IN p_id_tramite        BIGINT UNSIGNED,
  IN p_id_estado         TINYINT UNSIGNED,
  IN p_id_oficina_destino SMALLINT UNSIGNED,   -- NULL = no deriva
  IN p_id_usuario        INT UNSIGNED,
  IN p_comentario        VARCHAR(400)
)
BEGIN
  DECLARE v_oficina_origen SMALLINT UNSIGNED;
  DECLARE v_dueno          INT UNSIGNED;
  DECLARE v_nro            VARCHAR(12);
  DECLARE v_estado_nombre  VARCHAR(30);
  DECLARE v_final          TINYINT(1);

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    RESIGNAL;
  END;

  SELECT id_oficina_actual, id_usuario, nro_expediente
    INTO v_oficina_origen, v_dueno, v_nro
    FROM tramites WHERE id_tramite = p_id_tramite;

  SELECT nombre, es_final INTO v_estado_nombre, v_final
    FROM estados_tramite WHERE id_estado = p_id_estado;

  IF v_nro IS NULL OR v_estado_nombre IS NULL THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Trámite o estado inexistente';
  END IF;

  START TRANSACTION;

  UPDATE tramites
     SET id_estado         = p_id_estado,
         id_oficina_actual = COALESCE(p_id_oficina_destino, id_oficina_actual),
         fecha_cierre      = IF(v_final = 1, NOW(), NULL)
   WHERE id_tramite = p_id_tramite;

  INSERT INTO historial_tramite
    (id_tramite, id_estado, id_oficina_origen, id_oficina_destino, id_usuario, comentario)
  VALUES
    (p_id_tramite, p_id_estado, v_oficina_origen, p_id_oficina_destino, p_id_usuario, p_comentario);

  INSERT INTO notificaciones (id_usuario, id_tramite, titulo, mensaje)
  VALUES (v_dueno, p_id_tramite, CONCAT('Trámite ', v_estado_nombre),
          CONCAT('Tu trámite ', v_nro, ' cambió a: ', v_estado_nombre, '.'));

  COMMIT;
END$$

DELIMITER ;

-- -------------------------------------------------------------
-- M2, M4, M8. VISTAS PARA CONSULTAS Y REPORTES
-- -------------------------------------------------------------

CREATE VIEW v_catalogo_tupa AS
SELECT p.id_procedimiento, p.codigo, p.denominacion, p.seccion, c.nombre AS categoria,
       p.descripcion, p.plazo_dias_habiles, p.calificacion,
       MIN(t.monto) AS costo_desde, MAX(t.monto) AS costo_hasta,
       op.nombre AS se_presenta_en, orr.nombre AS responsable
  FROM procedimientos p
  JOIN categorias c   ON c.id_categoria = p.id_categoria
  JOIN oficinas op    ON op.id_oficina  = p.id_oficina_presentacion
  JOIN oficinas orr   ON orr.id_oficina = p.id_oficina_responsable
  LEFT JOIN tarifas_procedimiento t ON t.id_procedimiento = p.id_procedimiento
 WHERE p.vigente = 1
 GROUP BY p.id_procedimiento, p.codigo, p.denominacion, p.seccion, c.nombre,
          p.descripcion, p.plazo_dias_habiles, p.calificacion, op.nombre, orr.nombre;

CREATE VIEW v_tramites_detalle AS
SELECT t.id_tramite, t.nro_expediente, t.fecha_registro, t.fecha_limite, t.fecha_cierre,
       t.asunto, t.id_usuario, CONCAT(u.nombres, ' ', u.apellidos) AS administrado,
       p.codigo AS codigo_procedimiento, p.denominacion AS procedimiento,
       e.nombre AS estado, e.color AS color_estado,
       o.nombre AS oficina_actual, t.id_oficina_actual
  FROM tramites t
  JOIN usuarios u         ON u.id_usuario = t.id_usuario
  JOIN procedimientos p   ON p.id_procedimiento = t.id_procedimiento
  JOIN estados_tramite e  ON e.id_estado = t.id_estado
  JOIN oficinas o         ON o.id_oficina = t.id_oficina_actual;

CREATE VIEW v_reporte_por_estado AS
SELECT e.orden, e.nombre AS estado, COUNT(t.id_tramite) AS total
  FROM estados_tramite e
  LEFT JOIN tramites t ON t.id_estado = e.id_estado
 GROUP BY e.id_estado, e.orden, e.nombre;

CREATE VIEW v_reporte_por_oficina AS
SELECT o.nombre AS oficina,
       COUNT(t.id_tramite) AS recibidos,
       SUM(e.es_final = 1) AS atendidos,
       SUM(e.es_final = 0) AS pendientes
  FROM oficinas o
  JOIN tramites t        ON t.id_oficina_actual = o.id_oficina
  JOIN estados_tramite e ON e.id_estado = t.id_estado
 GROUP BY o.id_oficina, o.nombre;

CREATE VIEW v_tiempo_atencion AS
SELECT p.codigo, p.denominacion, p.plazo_dias_habiles AS plazo_tupa,
       COUNT(t.id_tramite) AS tramites_cerrados,
       ROUND(AVG(DATEDIFF(t.fecha_cierre, t.fecha_registro)), 1) AS dias_promedio
  FROM tramites t
  JOIN procedimientos p ON p.id_procedimiento = t.id_procedimiento
 WHERE t.fecha_cierre IS NOT NULL
 GROUP BY p.id_procedimiento, p.codigo, p.denominacion, p.plazo_dias_habiles;
