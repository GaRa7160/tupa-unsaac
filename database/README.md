# Base de datos `tupa_unsaac`

Diseño de la base de datos de la **Plataforma Web para la Optimización de la Gestión del TUPA de la UNSAAC**
(Desarrollo de Software I, Proyecto Semestral 2026-2).

| Archivo | Contenido |
|---|---|
| `01_schema.sql` | 17 tablas, 5 vistas de reportes, 1 función y 2 procedimientos almacenados |
| `02_base.sql` | Roles, sedes y estados del trámite |
| `03_catalogo_tupa.sql` | Catálogo real del TUPA: 80 fichas (35 procedimientos y 45 servicios), 299 requisitos, 93 tarifas, 68 recursos y 24 oficinas. **Generado**, no editar a mano |
| `04_demo.sql` | Usuarios y 7 trámites ficticios para pruebas |
| `diagrama_er.png` / `.svg` | Modelo entidad-relación generado desde el esquema real |
| `herramientas/extraer_tupa.py` | Lee el PDF del TUPA y produce un JSON con las fichas |
| `herramientas/generar_catalogo.py` | Convierte el JSON en `03_catalogo_tupa.sql` y `web/js/datos-tupa.js` |
| `herramientas/generar_er.py` | Regenera el diagrama a partir de la base (requiere `mysql` y Graphviz) |

## Cómo crearla (MySQL 8 o MariaDB 10.4+)

```bash
mysql -u root -p < 01_schema.sql
mysql -u root -p < 02_base.sql
mysql -u root -p < 03_catalogo_tupa.sql
mysql -u root -p < 04_demo.sql
```

En XAMPP: phpMyAdmin → Importar → en orden `01_schema.sql`, `02_base.sql`, `03_catalogo_tupa.sql` y `04_demo.sql`.

## Módulos y tablas

| Módulo | Tablas |
|---|---|
| M1 Acceso y organización | `roles`, `usuarios`, `oficinas`, `sedes` |
| M2 Catálogo TUPA | `categorias`, `procedimientos`, `procedimiento_presentacion`, `tarifas_procedimiento`, `requisitos_procedimiento`, `recursos_procedimiento` |
| M3, M4, M7 Trámites y seguimiento | `tramites`, `estados_tramite`, `historial_tramite` |
| M5 Notificaciones y ayuda | `notificaciones`, `tickets_ayuda` |
| M6 Documentos y pagos | `documentos`, `pagos` |
| M8 Reportes | vistas `v_reporte_por_estado`, `v_reporte_por_oficina`, `v_tiempo_atencion` |

## Lógica en la base

- `sp_registrar_tramite`: genera el N° de expediente (`AAAA-NNNNNN`), calcula la fecha límite en días hábiles,
  abre la línea de tiempo y notifica al administrado.
- `sp_cambiar_estado_tramite`: cambia el estado, deriva de oficina, registra el historial y notifica.
- `fn_sumar_dias_habiles`: suma días hábiles (lunes a viernes, sin feriados).

Los usuarios y trámites de `04_demo.sql` son ficticios y las contraseñas son un marcador, no valores reales.
