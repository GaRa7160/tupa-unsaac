# Plataforma Web para la Optimización de la Gestión del TUPA de la UNSAAC

Proyecto Semestral 2026-2 · Desarrollo de Software I · Escuela Profesional de Ingeniería Informática y de Sistemas · UNSAAC

| Integrante | Código | Rol |
|---|---|---|
| José Javier Huamán Sutta | 230969 | Product Owner y desarrollador |
| Mario Gabriel Melo Cajahuillca | 231867 | Scrum Master y desarrollador |
| Diego Edu Uscapi Pucho | 210944 | Desarrollador |

Docentes: Mtro. Luis Álvaro Monzón Condori · Mtro. Julio Vladimir Quispe Sota

## Qué contiene este repositorio (Primera unidad)

| Carpeta | Entrega | Contenido |
|---|---|---|
| `web/` | Entrega 2 · Implementación de GUIs | 14 pantallas HTML/CSS/JavaScript navegables, con 4 roles y datos de demostración |
| `database/` | Entrega 2 · Diseño de bases de datos | Esquema MySQL/MariaDB (17 tablas), catálogo real del TUPA (80 fichas), diagrama ER |
| `docs/` | Entrega 1 y 2 | Flujo de trabajo en Git, backlog Scrum y capturas de pantalla |

El prototipo dinámico de la Entrega 1 es la propia versión navegable de `web/`: cada pantalla enlaza con las demás
y reproduce el flujo completo (registrar, observar, derivar, resolver).

## Cómo probar las pantallas

No necesita instalar nada: abre `web/index.html` en el navegador (o `python3 -m http.server -d web 8000` y visita `http://localhost:8000`).

Cuentas de demostración (contraseña **demo123**):

| Rol | Correo |
|---|---|
| Administrado (estudiante) | ana.quispe@demo.unsaac.edu.pe |
| Mesa de partes | mesapartes@demo.unsaac.edu.pe |
| Oficina responsable | decanato@demo.unsaac.edu.pe |
| Administrador | admin@demo.unsaac.edu.pe |

Los datos se guardan en el navegador (`localStorage`). El botón «Restablecer datos de demostración» del acceso los reinicia.

## Cómo crear la base de datos

Ver [`database/README.md`](database/README.md).

## Fuente del catálogo

Texto Único de Procedimientos Administrativos de la UNSAAC, vigente, modificado y publicado según la Resolución CU-547-2025-UNSAAC.
Los datos de usuarios y trámites de demostración son ficticios.

## Trabajo en equipo

Ver [`docs/flujo-git.md`](docs/flujo-git.md) y [`docs/backlog-scrum.md`](docs/backlog-scrum.md).
