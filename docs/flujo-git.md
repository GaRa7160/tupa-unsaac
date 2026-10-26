# Flujo de trabajo en Git

Repositorio: `tupa-unsaac`. Los tres integrantes son colaboradores y cada uno trabaja con su propia cuenta de GitHub.

## Ramas

| Rama | Uso |
|---|---|
| `main` | Versión entregable. Solo recibe cambios por Pull Request |
| `develop` | Integración del sprint |
| `feature/<tema>` | Una rama por historia de usuario o área |

## Reglas

1. Nadie hace commit directo en `main` ni en `develop`.
2. Cada área se trabaja en su rama `feature/...` y se une a `develop` con un Pull Request.
3. Cada Pull Request lo revisa **otra persona** (rotación: José revisa a Mario, Mario revisa a Diego, Diego revisa a José).
4. Commits pequeños, en español, en presente y con prefijo: `feat:`, `fix:`, `docs:`, `style:`, `refactor:`.
5. Al cerrar el sprint se fusiona `develop` en `main` con un Pull Request y se crea la etiqueta `sprint-1`.

## Reparto de ramas del Sprint 1

| Rama | Responsable | Contenido |
|---|---|---|
| `feature/estilos-nucleo` | Mario | `css/estilos.css`, `js/app.js`, `js/datos-demo.js`, imagen del escudo |
| `feature/acceso` | Mario | `index` (acceso) |
| `docs/arquitectura` | Mario | Diagrama de arquitectura, actas de las reuniones diarias |
| `feature/base-datos` | Diego | `database/01_schema.sql`, `02_base.sql`, `03_catalogo_tupa.sql`, `04_demo.sql`, README, diagrama ER y herramientas |
| `feature/consulta-tupa` | Diego | `catalogo`, `procedimiento`, `seguimiento` y `datos-tupa.js` |
| `feature/avisos-ayuda` | Diego | `notificaciones` y `ayuda` |
| `docs/fundamentos` | Diego | Fundamentos teóricos y diagrama de estados |
| `feature/tramites` | José | `registro`, `inicio`, `nuevo-tramite`, `mis-tramites` y `tramite` |
| `feature/oficina-admin` | José | `panel-oficina`, `reportes` y `admin` |
| `docs/especificacion-figma` | José | Requerimientos, casos de uso, capturas y diseño en Figma |

## Comandos

```bash
git clone https://github.com/<usuario>/tupa-unsaac.git
cd tupa-unsaac
git checkout develop && git pull
git checkout -b feature/<rama>
git add <solo tus archivos>
git commit -m "feat: <qué hiciste>"
git push -u origin feature/<rama>
# abrir el Pull Request hacia develop en GitHub
```
