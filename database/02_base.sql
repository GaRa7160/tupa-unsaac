-- =============================================================
-- Datos base: roles, sedes de atención y estados del trámite
-- Sedes: TUPA UNSAAC, sección 4 (CU-547-2025-UNSAAC).
-- =============================================================
USE tupa_unsaac;
SET NAMES utf8mb4;

-- Roles
INSERT INTO roles (id_rol, nombre, descripcion) VALUES
 (1, 'ADMINISTRADO',  'Estudiante, egresado o externo que consulta el TUPA y registra trámites'),
 (2, 'MESA_PARTES',   'Unidad de Trámite Documentario: recibe, valida requisitos y pago, y deriva'),
 (3, 'OFICINA',       'Oficina responsable: atiende, observa o resuelve los trámites'),
 (4, 'ADMINISTRADOR', 'Mantiene procedimientos, oficinas y usuarios; ve los reportes');

-- Sedes (TUPA, sección 4: Sedes de atención)
INSERT INTO sedes (id_sede, nombre, direccion, horario, es_filial) VALUES
 (1, 'Ciudad Universitaria',          'Cusco - Av. De La Cultura N° 733',                    'Lunes a Viernes de 07:15 a 14:45', 0),
 (2, 'Rectorado (Secretaría General)','Cusco - Calle Tigre N° 110',                          'Lunes a Viernes de 07:15 a 13:00', 0),
 (3, 'Filial Sicuani',                'Sicuani - Av. Arequipa N° 150',                       'Lunes a Viernes de 07:15 a 15:00', 1),
 (4, 'Filial Puerto Maldonado',       'Tambopata, Madre de Dios - Calle Piura N° 1056',      'Lunes a Viernes de 07:15 a 15:00', 1),
 (5, 'Filial Santo Tomás',            'Santo Tomás, Chumbivilcas - Av. de la Cultura S/N Sector Accopampa', 'Lunes a Viernes de 07:15 a 15:00', 1),
 (6, 'Filial Espinar',                'Espinar - Av. Circunvalación S/N',                    'Lunes a Viernes de 07:15 a 15:00', 1),
 (7, 'Filial Yanaoca',                'Yanaoca, Canas - Av. Tupac Amaru S/N',                'Lunes a Viernes de 07:15 a 15:00', 1),
 (8, 'Filial Andahuaylas',            'Andahuaylas, Apurímac - Jr. Los Girasoles S/N Pochccota', 'Lunes a Viernes de 07:15 a 15:00', 1),
 (9, 'Paraninfo Universitario',       'Cusco - Plaza de Armas S/N',                          'Lunes a Viernes de 07:15 a 13:00', 0);

-- Estados del trámite
INSERT INTO estados_tramite (id_estado, nombre, orden, es_final, color) VALUES
 (1, 'Registrado',        1, 0, '#6B7280'),
 (2, 'Pendiente de pago', 2, 0, '#D97706'),
 (3, 'En revisión',       3, 0, '#2563EB'),
 (4, 'Observado',         4, 0, '#DC2626'),
 (5, 'Derivado',          5, 0, '#7C3AED'),
 (6, 'En atención',       6, 0, '#0891B2'),
 (7, 'Resuelto',          7, 1, '#16A34A'),
 (8, 'Archivado',         8, 1, '#374151');
