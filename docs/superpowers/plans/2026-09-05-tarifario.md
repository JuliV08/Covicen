# Tarifario y catálogo del tramo — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el primer sistema de Covicen: backend Django con catálogo del tramo y tarifario con vigencias, panel del operador en React con el tema "Papel con marco de tinta", API pública que alimenta la landing, y la landing reconstruyéndose sola al publicar. Todo funcional en la máquina de Juli con un comando; el mismo paquete se despliega al VPS cuando exista.

**Architecture:** Un proyecto Django (`backend/`) con cuatro apps (`cuentas`, `tramo`, `tarifario`, `publicacion`) y dos APIs DRF: pública de solo lectura (`/api/v1/`, contrato del front) y privada por sesión (`/api/panel/`). Un panel React (`panel/`) servido como estático por Caddy en el mismo origen que `/api/`. Postgres 17 con las reglas de negocio en restricciones (exclusión de vigencias, unicidad con nulos). Publicar dispara `repository_dispatch` a GitHub y la landing Astro (repo público) reconstruye leyendo la API. Docker Compose para local y prod.

**Tech Stack:** Python 3.12 · Django 5.2 LTS · DRF 3.18 · psycopg 3 · django-simple-history 3.13 · django-axes 8 · drf-spectacular 0.30 · pytest-django 4.14 + factory-boy 3.3 + responses 0.26 + jsonschema 4.26 · ruff · uv · Postgres 17 · React 18 + TypeScript 5.9 + Vite 8 + Tailwind 3.4 + Radix UI + TanStack Query 5 + react-router 7 + lucide-react + Vitest 5 + Testing Library · Playwright 1.63 (solo CI) · Caddy 2 · Docker Compose · GitHub Actions. Landing: Astro 7 + Zod 4 (ya existente).

**Spec:** `docs/superpowers/specs/2026-09-05-tarifario-design.md` (en el repo `JuliV08/Covicen`). El plan argumenta desde la spec; leé los dos. Decisiones y porqués: `obsidian/Sistemas de Covicen.md`; tema del panel: `obsidian/Sistema de diseno del panel.md`.

## Global Constraints

- **Dos repos.** Todo lo del backend, panel e infra va en el repo **privado** `covicen-sistemas` (Fase 0 lo crea). Los cambios de la landing (Fase D) van en el repo público `Covicen`. Nunca copiar `.env`, dumps ni nada de `CVSA/` a ningún repo.
- **Español rioplatense** en código, comentarios, mensajes de error, commits y copy. Voseo en la UI ("Publicá"). Cuidar irregulares ("anduvo"). `snake_case` en Python, `kebab-case` en URLs, camelCase solo en el JSON del contrato.
- **No commitear sin pedido explícito de Juli.** Los pasos "Commit" solo se ejecutan si Juli autorizó commits por tarea al arrancar; si no, se reemplazan por `git add -A && git status`.
- **Cero emojis en la UI.** Íconos solo `lucide-react`. Tokens semánticos solamente; nunca `bg-gray-*`, `dark:*` ni colores literales. Un solo `Button`, un solo `Select`, `EmptyState` para vacíos.
- **Sin `django.contrib.admin`.** Sin Celery, sin Redis, sin CORS (el panel es mismo origen; el build de la landing es servidor a servidor).
- **API pública: `authentication_classes = []`, solo lectura, throttle 120/min, caché compartido (`DatabaseCache`), 404 con `no-store`.** Panel: sesión `HttpOnly` + CSRF por header, `csrf_protect` explícito en el login, `django-axes` 5 intentos/hora, permisos que exigen `view_*` también en GET.
- **Serializers con campos explícitos y `read_only_fields`; nunca `fields = '__all__'`. ViewSets con `get_queryset()` explícito.** Dinero con `Decimal` + `ROUND_HALF_UP`. Reglas de negocio también como restricciones en Postgres.
- **Tests en Postgres real** (nunca SQLite). TDD: test que falla → implementación mínima → verde → refactor. `test.skip`, `.only`, tests sin assert y `TODO` son bloqueantes.
- **Nada de Chrome headless en la máquina de Juli.** Playwright corre solo en GitHub Actions. La validación visual la hace Juli en su navegador.
- **Secretos por variables de entorno.** `infra/.env.ejemplo` con todas las claves y sin valores reales. `gitleaks` en CI.
- **Sin CI en la nube por ahora (2026-09-06: la máquina de Juli tiene 16 GB y no quedan minutos gratis de Actions para repos privados).** La compuerta es local y automática: `lefthook` con un gancho `pre-push` que corre lo mismo que la CI (lint, `makemigrations --check`, `pytest`, `tsc`, `eslint`, `vitest`). Los workflows de Actions se escriben igual (Tareas 13, 21, 24) y corren el día que haya un runner propio en el VPS de Covicen (gratis, sin minutos) o GitHub Pro. Tests siempre de a un proceso (`pytest -p no:xdist`, `vitest --maxWorkers 1`), los del backend adentro del contenedor, la suite completa solo al cierre de cada fase.
- **Verificación antes de declarar listo:** `ruff check`, `ruff format --check`, `manage.py makemigrations --check`, `pytest`, `tsc --noEmit`, `eslint`, `vitest`, `pnpm build`; en la landing `pnpm check`, `pnpm test`, `pnpm build`, `pnpm verificar`. Se pega la salida real.
- **Ejecución híbrida:** el tech lead hace inline lo que lleva criterio (Tareas 3 a 7, 10, 22); `bk-bro`, `ux-bro`, `ops-bro`, `test-bro` toman lo mecánico en archivos disjuntos, en paralelo; `rev-bro` revisa cada fase sobre código que no escribió; `sec-bro` hace la segunda pasada de la Tarea 25. Nunca agentes `oh-my-claudecode:*`.
- Entorno: Windows 11 + Git Bash + Docker Desktop 29, Node 25, pnpm 10, Python 3.12. Rutas en comandos con `/`. Los comandos de Django corren dentro del contenedor `backend` (`docker compose -f infra/compose.yaml exec backend ...`) o en un venv local con `DATABASE_URL` apuntando al Postgres de Docker.

---

## Estructura de archivos

Repo `covicen-sistemas` (privado):

```
covicen-sistemas/
├── .claude/agents/{sec,bk,ux,test,rev,ops}-bro.md   ← copiados del repo Covicen
├── .github/workflows/ci.yml, deploy.yml
├── .gitignore  .env nunca; .gitleaks.toml
├── README.md   qué es, cómo levantar en local (los 4 comandos de la spec §10)
├── docs/runbooks/{vps.md, backup-restore.md, token-github.md, usuarios.md, deploy-fallido.md}
├── infra/
│   ├── compose.yaml          local: db, backend (runserver), panel (vite)
│   ├── compose.prod.yaml     prod: db, backend (gunicorn), panel (caddy), backup
│   ├── .env.ejemplo
│   ├── caddy/Caddyfile
│   └── backup/{backup.sh, restore.sh, Dockerfile}
├── backend/
│   ├── pyproject.toml  uv.lock  Dockerfile  manage.py  pytest.ini  ruff.toml
│   ├── config/{settings/{base,local,prod,test}.py, urls.py, wsgi.py}
│   ├── apps/
│   │   ├── comun/{archivos.py, permisos.py, throttles.py, cache.py, historial.py}
│   │   ├── cuentas/{models.py, migrations/, serializers.py, views.py, urls.py, tests/}
│   │   ├── tramo/{models.py, migrations/, serializers.py, api_publica.py, api_panel.py, urls.py, tests/}
│   │   ├── tarifario/{models.py, migrations/, servicios.py, serializers.py, api_publica.py, api_panel.py, urls.py, management/commands/cargar_demo.py, fixtures/demo/tramo.json, tests/}
│   │   └── publicacion/{models.py, migrations/, servicios.py, serializers.py, views.py, urls.py, tests/}
│   └── tests/{conftest.py, factories.py, contrato/test_contrato.py}
├── panel/
│   ├── package.json  vite.config.ts  tailwind.config.js  tsconfig.json  Dockerfile (caddy)
│   └── src/
│       ├── main.tsx  app/{router.tsx, providers.tsx, rutas-protegidas.tsx}
│       ├── index.css                       tokens (V-Shop re-tokenizado con la marca)
│       ├── componentes/ui/{Button,Select,EmptyState,PageHeader,Breadcrumbs,Dialogo,Chip,Tabla,Drawer,Campo}.tsx
│       ├── componentes/layouts/{Shell,Sidebar,Header}.tsx
│       ├── servicios/{http.ts, sesion.ts, catalogo.ts, categorias.ts, cuadros.ts, publicaciones.ts, usuarios.ts, inicio.ts}
│       ├── paginas/{ingresar, inicio, catalogo/{rutas,ciudades,cabinas}, categorias, cuadros/{lista,detalle,grilla}, publicaciones, usuarios, mi-cuenta}/
│       ├── lib/{formato.ts, iva.ts, permisos.ts}
│       └── __tests__/ guards (contrasteTokens, coloresCableados, botonesCableados, selectNativo, iconosSvg, jergaInline, animacionesVivas)
└── e2e/{package.json, playwright.config.ts, publicar.spec.ts}
```

Repo `Covicen` (público), Fase D:

```
src/lib/config.ts                      + apiUrl
src/lib/datos/esquemas.ts              + montoConIva, freeFlow (opcionales)
src/lib/datos/fuentes/api.ts           tramo() y tarifario() reales
src/lib/datos/index.ts                 composición api + local
scripts/exportar-contrato.ts           → docs/contrato/{tramo,tarifario}.schema.json
tests/datos/fuente-api.test.ts, tests/datos/contrato.test.ts, tests/fixtures/api/{tramo,tarifario}.json
.github/workflows/pages.yml            repository_dispatch + schedule + API_URL
obsidian/Home.md, obsidian/Costura de datos.md   estado y cómo se enchufó
```

---

## Fase 0 — Repo y esqueleto

### Task 1: Repo privado, esqueleto Django y calidad de base

**Files:**
- Create: `covicen-sistemas/` (todo lo listado arriba que no es código de apps), `backend/pyproject.toml`, `backend/config/settings/{__init__,base,local,prod,test}.py`, `backend/config/{urls,wsgi,asgi}.py`, `backend/manage.py`, `backend/ruff.toml`, `backend/pytest.ini`, `backend/tests/conftest.py`, `backend/apps/__init__.py`, `.gitignore`, `.gitleaks.toml`, `README.md`
- Copy: `Covicen/.claude/agents/*.md` → `covicen-sistemas/.claude/agents/`

**Interfaces:**
- Produces: `config.settings.base` con `INSTALLED_APPS` (sin admin), `AUTH_USER_MODEL = "cuentas.Usuario"`, `DATABASES` desde `DATABASE_URL`, `REST_FRAMEWORK` base, `CACHES` con `DatabaseCache`; `config.settings.test` que hereda de `base` con `PASSWORD_HASHERS` rápido.

- [ ] **Step 1: Crear el repo privado (lo hace Juli, o la sesión con su OK)**

```bash
mkdir -p /c/Users/Villex/dev/covicen-sistemas && cd /c/Users/Villex/dev/covicen-sistemas
git init -b main
gh repo create JuliV08/covicen-sistemas --private --source=. --remote=origin --description "Sistemas internos de Covicen: tarifario, catálogo del tramo, panel y API" 
mkdir -p .claude/agents .github/workflows docs/runbooks infra/caddy infra/backup backend/apps backend/config/settings backend/tests panel e2e
cp /c/Users/Villex/dev/Covicen/.claude/agents/*.md .claude/agents/
```

- [ ] **Step 2: `.gitignore` y `.gitleaks.toml`**

```gitignore
# .gitignore
.env
infra/.env
*.pyc
__pycache__/
.venv/
backend/media/
backend/staticfiles/
node_modules/
panel/dist/
e2e/test-results/
e2e/playwright-report/
.pytest_cache/
.ruff_cache/
```

```toml
# .gitleaks.toml
[extend]
useDefault = true
[allowlist]
paths = ['''infra/\.env\.ejemplo''', '''docs/runbooks/.*''']
```

- [ ] **Step 3: `backend/pyproject.toml` con uv**

```toml
[project]
name = "covicen-backend"
version = "0.1.0"
requires-python = ">=3.12,<3.13"
dependencies = [
  "Django~=5.2.0",
  "djangorestframework~=3.18",
  "psycopg[binary]~=3.3",
  "django-environ~=0.14",
  "django-simple-history~=3.13",
  "django-axes~=8.3",
  "drf-spectacular~=0.30",
  "gunicorn~=26.0",
  "requests~=2.32",
  "django-filter~=25.1",
]
[dependency-groups]
dev = [
  "pytest~=9.0", "pytest-django~=4.14", "factory-boy~=3.3", "responses~=0.26",
  "jsonschema~=4.26", "ruff~=0.16", "pip-audit~=2.9",
]
[tool.pytest.ini_options]
DJANGO_SETTINGS_MODULE = "config.settings.test"
python_files = ["test_*.py"]
addopts = "-q --reuse-db"
```

Si alguna versión no resuelve, `uv lock` lo dice: bajar el `~=` al mayor que exista, nunca quitar el pin.

- [ ] **Step 4: `ruff.toml`**

```toml
line-length = 100
target-version = "py312"
extend-exclude = ["migrations"]
[lint]
select = ["E", "W", "F", "I", "B", "UP", "DJ", "C4", "SIM", "S"]
ignore = ["E501", "B008"]
[lint.per-file-ignores]
"**/tests/**" = ["S101", "S106"]
"**/management/commands/**" = ["T201"]
[format]
quote-style = "single"
```

- [ ] **Step 5: Settings divididos**

```python
# backend/config/settings/base.py
from pathlib import Path
import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent
env = environ.Env(DEBUG=(bool, False))
environ.Env.read_env(BASE_DIR.parent / 'infra' / '.env', overwrite=False)

SECRET_KEY = env('DJANGO_SECRET_KEY')
DEBUG = env('DEBUG')
ENTORNO = env('ENTORNO', default='local')  # local | prod
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

INSTALLED_APPS = [
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'simple_history',
    'axes',
    'drf_spectacular',
    'django_filters',
    'apps.comun',
    'apps.cuentas',
    'apps.tramo',
    'apps.tarifario',
    'apps.publicacion',
]
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'simple_history.middleware.HistoryRequestMiddleware',
    'axes.middleware.AxesMiddleware',
]
ROOT_URLCONF = 'config.urls'
WSGI_APPLICATION = 'config.wsgi.application'
TEMPLATES = [{'BACKEND': 'django.template.backends.django.DjangoTemplates', 'APP_DIRS': True,
              'OPTIONS': {'context_processors': ['django.contrib.auth.context_processors.auth',
                                                 'django.contrib.messages.context_processors.messages']}}]
DATABASES = {'default': env.db('DATABASE_URL')}
DATABASES['default']['CONN_MAX_AGE'] = 60
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'cuentas.Usuario'
AUTHENTICATION_BACKENDS = ['axes.backends.AxesStandaloneBackend', 'django.contrib.auth.backends.ModelBackend']
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator', 'OPTIONS': {'min_length': 12}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
LANGUAGE_CODE = 'es-ar'
TIME_ZONE = 'America/Argentina/Cordoba'
USE_I18N = True
USE_TZ = True
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
DATA_UPLOAD_MAX_MEMORY_SIZE = 12 * 1024 * 1024
FILE_UPLOAD_MAX_MEMORY_SIZE = 12 * 1024 * 1024

CACHES = {'default': {'BACKEND': 'django.core.cache.backends.db.DatabaseCache', 'LOCATION': 'cache_django'}}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': ['rest_framework.authentication.SessionAuthentication'],
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.IsAuthenticated'],
    'DEFAULT_RENDERER_CLASSES': ['rest_framework.renderers.JSONRenderer'],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_FILTER_BACKENDS': ['django_filters.rest_framework.DjangoFilterBackend', 'rest_framework.filters.SearchFilter', 'rest_framework.filters.OrderingFilter'],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.LimitOffsetPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_THROTTLE_RATES': {'anon': '120/min', 'reintento': '5/min'},
    'NUM_PROXIES': 1,
    'EXCEPTION_HANDLER': 'apps.comun.excepciones.manejador',
}
SPECTACULAR_SETTINGS = {'TITLE': 'API de Covicen', 'VERSION': '1', 'SERVE_INCLUDE_SCHEMA': False}

AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = 1  # horas
AXES_LOCKOUT_PARAMETERS = ['username']  # por usuario: falsificar X-Forwarded-For no lo evade; la IP real queda registrada
AXES_IPWARE_PROXY_COUNT = 1
AXES_IPWARE_META_PRECEDENCE_ORDER = ['HTTP_X_FORWARDED_FOR', 'REMOTE_ADDR']
AXES_RESET_ON_SUCCESS = True

SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_HTTPONLY = False  # el panel la lee para mandar X-CSRFToken
X_FRAME_OPTIONS = 'DENY'
SECURE_CONTENT_TYPE_NOSNIFF = True

GITHUB_DISPATCH_TOKEN = env('GITHUB_DISPATCH_TOKEN', default='')
GITHUB_DISPATCH_REPO = env('GITHUB_DISPATCH_REPO', default='JuliV08/Covicen')
```

```python
# backend/config/settings/local.py
from .base import *  # noqa: F403
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1', 'backend']
```

```python
# backend/config/settings/prod.py
from .base import *  # noqa: F403
DEBUG = False
ENTORNO = 'prod'
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS')  # noqa: F405  ej. https://panel.covicen.com.ar
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
LOGGING = {'version': 1, 'disable_existing_loggers': False,
           'handlers': {'consola': {'class': 'logging.StreamHandler'}},
           'root': {'handlers': ['consola'], 'level': 'INFO'}}
```

```python
# backend/config/settings/test.py
from .base import *  # noqa: F403
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
CACHES = {'default': {'BACKEND': 'django.core.cache.backends.locmem.LocMemCache'}}
AXES_ENABLED = True
GITHUB_DISPATCH_TOKEN = ''
```

- [ ] **Step 6: `config/urls.py`, `conftest.py` y un test de humo**

```python
# backend/config/urls.py
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('api/v1/', include('apps.tramo.urls_publica')),
    path('api/v1/', include('apps.tarifario.urls_publica')),
    path('api/panel/', include('apps.cuentas.urls')),
    path('api/panel/', include('apps.tramo.urls_panel')),
    path('api/panel/', include('apps.tarifario.urls_panel')),
    path('api/panel/', include('apps.publicacion.urls')),
    path('api/schema/', SpectacularAPIView.as_view(authentication_classes=[], permission_classes=[]), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema', authentication_classes=[], permission_classes=[])),
]
```

(Las `urls_*` de cada app se crean vacías en este paso, `urlpatterns = []`, y se llenan en sus tareas.)

```python
# backend/tests/conftest.py
import pytest
from rest_framework.test import APIClient

@pytest.fixture
def cliente():
    return APIClient(enforce_csrf_checks=True)

@pytest.fixture
def cliente_sin_csrf():
    return APIClient()
```

```python
# backend/tests/test_humo.py
import pytest
from django.core.management import call_command

@pytest.mark.django_db
def test_check_y_migraciones_al_dia():
    call_command('check')
    call_command('makemigrations', '--check', '--dry-run')
```

- [ ] **Step 7: Levantar Postgres local y correr**

```bash
# infra/.env.ejemplo (copiar a infra/.env y completar)
DJANGO_SECRET_KEY=cambiar-por-64-caracteres-al-azar
DEBUG=true
ENTORNO=local
# El superusuario de Postgres (POSTGRES_USER) solo administra; la app entra con el rol covicen_app, sin privilegios.
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin_local
POSTGRES_DB=covicen
APP_DB_PASSWORD=covicen_local
DATABASE_URL=postgres://covicen_app:covicen_local@db:5432/covicen
ALLOWED_HOSTS=localhost,127.0.0.1,backend
GITHUB_DISPATCH_TOKEN=
GITHUB_DISPATCH_REPO=JuliV08/Covicen
```

La Tarea 2 crea `infra/compose.yaml`; hasta entonces, para verificar este paso alcanza un Postgres efímero:

```bash
docker run -d --name covicen-db-tmp -e POSTGRES_USER=covicen_app -e POSTGRES_PASSWORD=covicen_local -e POSTGRES_DB=covicen -p 127.0.0.1:5432:5432 postgres:17  # efímero: acá sí es superusuario, solo para este paso
cd backend && uv sync && DATABASE_URL=postgres://covicen_app:covicen_local@127.0.0.1:5432/covicen DJANGO_SECRET_KEY=x uv run python manage.py createcachetable && uv run pytest
```

Expected: `uv sync` resuelve; `pytest` verde con 1 test (las apps de Step 5 existen como paquetes vacíos con `apps.py`; `AUTH_USER_MODEL` falla hasta la Tarea 3: crear en este paso `apps/cuentas/models.py` con `class Usuario(AbstractUser): pass` provisorio y su migración inicial, que la Tarea 3 reemplaza antes de que exista ninguna base compartida).

- [ ] **Step 8: `ruff check backend && ruff format --check backend` → sin errores. Commit: `chore: esqueleto Django, settings divididos, calidad de base`**

### Task 2: Docker Compose local (db + backend) y `.env.ejemplo`

**Files:**
- Create: `infra/compose.yaml`, `infra/db/init/01-rol-app.sql`, `backend/Dockerfile`, `backend/entrypoint.sh`
- Modify: `README.md`

**Interfaces:**
- Produces: servicio `db` (postgres:17, sin puerto al host salvo `--profile debug`), servicio `backend` en `http://localhost:8000`, comando `docker compose -f infra/compose.yaml exec backend uv run python manage.py <cmd>`.

- [ ] **Step 1: Dockerfile multi-stage con uv**

```dockerfile
# backend/Dockerfile
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_PROJECT_ENVIRONMENT=/opt/venv
RUN apt-get update && apt-get install -y --no-install-recommends libpq5 && rm -rf /var/lib/apt/lists/* \
 && useradd --create-home --uid 1000 app
COPY --from=ghcr.io/astral-sh/uv:0.9 /uv /usr/local/bin/uv
WORKDIR /app
COPY pyproject.toml uv.lock ./
FROM base AS dev
RUN uv sync --frozen
COPY . .
RUN chmod +x entrypoint.sh && chown -R app:app /app
USER app
ENTRYPOINT ["./entrypoint.sh"]
CMD ["uv", "run", "python", "manage.py", "runserver", "0.0.0.0:8000"]
FROM base AS prod
RUN uv sync --frozen --no-dev
COPY . .
RUN chmod +x entrypoint.sh && chown -R app:app /app
USER app
ENTRYPOINT ["./entrypoint.sh"]
CMD ["uv", "run", "gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--forwarded-allow-ips", "*"]
```

```bash
#!/bin/sh
# backend/entrypoint.sh
set -e
uv run python manage.py migrate --noinput
uv run python manage.py createcachetable
exec "$@"
```

- [ ] **Step 2: Rol de la app sin privilegios**

```sql
-- infra/db/init/01-rol-app.sql  (corre solo la primera vez que se crea el volumen)
CREATE ROLE covicen_app LOGIN PASSWORD :'APP_DB_PASSWORD' NOSUPERUSER NOCREATEDB NOCREATEROLE;
ALTER DATABASE covicen OWNER TO covicen_app;
```

El script se ejecuta como `01-rol-app.sh` que hace `psql -v APP_DB_PASSWORD="$APP_DB_PASSWORD" -f /docker-entrypoint-initdb.d/01-rol-app.sql` (las variables no se interpolan en `.sql` directo). `password_encryption = scram-sha-256` es el default de Postgres 17.

- [ ] **Step 3: `infra/compose.yaml`**

```yaml
name: covicen
services:
  db:
    image: postgres:17
    env_file: .env
    volumes: [db:/var/lib/postgresql/data, ./db/init:/docker-entrypoint-initdb.d:ro]
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"], interval: 5s, retries: 10 }
  db-debug:
    extends: db
    profiles: [debug]
    ports: ["127.0.0.1:5432:5432"]
  backend:
    build: { context: ../backend, target: dev }
    env_file: .env
    environment: { DJANGO_SETTINGS_MODULE: config.settings.local }
    volumes: [../backend:/app, media:/app/media]
    ports: ["127.0.0.1:8000:8000"]
    depends_on: { db: { condition: service_healthy } }
volumes: { db: {}, media: {} }
```

- [ ] **Step 4: Verificar**

```bash
cp infra/.env.ejemplo infra/.env   # y poner un DJANGO_SECRET_KEY real
docker compose -f infra/compose.yaml up -d --build
docker compose -f infra/compose.yaml exec backend uv run pytest
curl -s http://localhost:8000/api/docs/ | head -c 200
```

Expected: `pytest` verde dentro del contenedor; `/api/docs/` devuelve HTML de Swagger. Documentar los cuatro comandos en `README.md` (sección "Levantar en local").

- [ ] **Step 5: Commit: `chore(infra): compose local con Postgres 17, rol de la app sin privilegios y backend`**

---

## Fase A — Backend: modelo y reglas de negocio (tech lead inline, con `bk-bro` para lo mecánico)

### Task 3: `cuentas`: usuario propio, grupos, historial sin contraseña

**Files:**
- Modify: `backend/apps/cuentas/models.py` (reemplaza el provisorio), `backend/apps/cuentas/migrations/0001_initial.py` (regenerar), `backend/apps/cuentas/migrations/0002_grupos.py`
- Create: `backend/apps/comun/historial.py`, `backend/tests/factories.py`, `backend/apps/cuentas/tests/test_modelo.py`

**Interfaces:**
- Produces: `Usuario` (`email` como login, minúsculas), grupos `Carga` / `Publicación` / `Administración` con permisos (§4.1), `tests.factories.UsuarioFactory(grupo='Carga')`, helper `apps.comun.historial.registrar_historial(modelo, **kw)`.

- [ ] **Step 1: Tests que fallan**

```python
# backend/apps/cuentas/tests/test_modelo.py
import pytest
from django.contrib.auth.models import Group
from apps.cuentas.models import Usuario

@pytest.mark.django_db
def test_el_email_se_guarda_en_minusculas_y_es_el_login():
    u = Usuario.objects.create_user(email='Ana@Covicen.com.ar', password='una-clave-larga-123')
    assert u.email == 'ana@covicen.com.ar'
    assert Usuario.USERNAME_FIELD == 'email'

@pytest.mark.django_db
def test_no_hay_dos_usuarios_con_el_mismo_email_en_distinto_caso():
    Usuario.objects.create_user(email='ana@covicen.com.ar', password='una-clave-larga-123')
    with pytest.raises(Exception):
        Usuario.objects.create_user(email='ANA@covicen.com.ar', password='otra-clave-larga-123')

@pytest.mark.django_db
def test_existen_los_tres_grupos_con_sus_permisos():
    carga = Group.objects.get(name='Carga')
    publicacion = Group.objects.get(name='Publicación')
    admin = Group.objects.get(name='Administración')
    codigos = lambda g: set(g.permissions.values_list('codename', flat=True))
    assert {'add_cuadro', 'change_cuadro', 'view_cuadro', 'view_publicacion'} <= codigos(carga)
    assert 'publicar_cuadro' not in codigos(carga)
    assert {'publicar_cuadro', 'archivar_cuadro', 'add_publicacion'} <= codigos(publicacion)
    assert {'add_usuario', 'change_usuario', 'view_usuario'} <= codigos(admin)

@pytest.mark.django_db
def test_el_historial_del_usuario_no_guarda_la_contrasena():
    u = Usuario.objects.create_user(email='ana@covicen.com.ar', password='una-clave-larga-123')
    campos = {f.name for f in u.history.model._meta.get_fields()}
    assert 'password' not in campos and 'last_login' not in campos
```

Run: `uv run pytest apps/cuentas -v` → FAIL (grupos inexistentes, `history` inexistente).

- [ ] **Step 2: Modelo**

```python
# backend/apps/cuentas/models.py
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from simple_history.models import HistoricalRecords


class UsuarioManager(BaseUserManager):
    use_in_migrations = True

    def _crear(self, email, password, **extra):
        if not email:
            raise ValueError('El email es obligatorio')
        usuario = self.model(email=self.normalize_email(email).lower(), **extra)
        usuario.set_password(password)
        usuario.save(using=self._db)
        return usuario

    def create_user(self, email, password=None, **extra):
        extra.setdefault('is_staff', False)
        extra.setdefault('is_superuser', False)
        return self._crear(email, password, **extra)

    def create_superuser(self, email, password=None, **extra):
        extra.update(is_staff=True, is_superuser=True)
        return self._crear(email, password, **extra)


class Usuario(AbstractUser):
    username = None
    email = models.EmailField('email', unique=True)
    debe_cambiar_contrasena = models.BooleanField(default=False)
    history = HistoricalRecords(excluded_fields=['password', 'last_login'])

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    objects = UsuarioManager()

    class Meta:
        verbose_name = 'usuario'
        ordering = ['email']

    def save(self, *args, **kwargs):
        self.email = self.email.lower()
        super().save(*args, **kwargs)

    def __str__(self):
        return self.email
```

- [ ] **Step 3: Migración de grupos (depende de los modelos de las Tareas 4, 5 y 7 para los permisos; crearla con `dependencies` a las migraciones iniciales de `tramo`, `tarifario` y `publicacion`, y ejecutarla al final de la Fase A)**

```python
# backend/apps/cuentas/migrations/0002_grupos.py
from django.db import migrations

PERMISOS = {
    'Carga': [
        ('tramo', 'ruta', 'view add change'), ('tramo', 'ciudad', 'view add change'),
        ('tramo', 'trazadociudad', 'view add change delete'), ('tramo', 'cabina', 'view add change'),
        ('tramo', 'concesion', 'view change'),
        ('tarifario', 'categoriavehiculo', 'view add change'),
        ('tarifario', 'cuadro', 'view add change delete'), ('tarifario', 'tarifa', 'view add change delete'),
        ('publicacion', 'publicacion', 'view'),
    ],
    'Publicación': [('tarifario', 'cuadro', 'publicar archivar'), ('publicacion', 'publicacion', 'add')],
    'Administración': [('cuentas', 'usuario', 'view add change'), ('tramo', 'cabina', 'delete'),
                       ('tarifario', 'categoriavehiculo', 'delete')],
}

def crear(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')
    ContentType = apps.get_model('contenttypes', 'ContentType')
    acumulado = []
    for nombre in ['Carga', 'Publicación', 'Administración']:
        grupo, _ = Group.objects.get_or_create(name=nombre)
        for app, modelo, acciones in PERMISOS[nombre]:
            ct = ContentType.objects.get(app_label=app, model=modelo)
            for accion in acciones.split():
                codename = f'{accion}_{modelo}' if accion in ('view', 'add', 'change', 'delete') else f'{accion}_{modelo}'
                acumulado.append(Permission.objects.get(content_type=ct, codename=codename))
        grupo.permissions.set(acumulado)  # cada grupo incluye lo del anterior

class Migration(migrations.Migration):
    dependencies = [('cuentas', '0001_initial'), ('tramo', '0001_initial'), ('tarifario', '0001_initial'),
                    ('publicacion', '0001_initial'), ('contenttypes', '0002_remove_content_type_name')]
    operations = [migrations.RunPython(crear, migrations.RunPython.noop)]
```

Los permisos custom `publicar_cuadro` y `archivar_cuadro` los declara `Cuadro.Meta.permissions` en la Tarea 5 (codenames exactos `publicar_cuadro`, `archivar_cuadro`).

- [ ] **Step 4: Factories**

```python
# backend/tests/factories.py
import factory
from django.contrib.auth.models import Group
from apps.cuentas.models import Usuario

class UsuarioFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Usuario
        skip_postgeneration_save = True
    email = factory.Sequence(lambda n: f'usuario{n}@covicen.com.ar')
    first_name = 'Ana'
    last_name = 'Pérez'
    password = factory.PostGenerationMethodCall('set_password', 'una-clave-larga-123')

    @factory.post_generation
    def grupo(self, create, extracted, **kwargs):
        if create and extracted:
            self.groups.add(Group.objects.get(name=extracted))
            self.save()
```

- [ ] **Step 5: `uv run python manage.py makemigrations cuentas` (regenera 0001 sobre base vacía), luego `uv run pytest apps/cuentas -v` al cerrar la Fase A → PASS. Commit: `feat(cuentas): usuario por email, grupos Carga/Publicación/Administración, historial sin contraseña`**

### Task 4: `tramo`: catálogo (Concesion, Ruta, Ciudad, TrazadoCiudad, Cabina)

**Files:**
- Create: `backend/apps/tramo/models.py`, `backend/apps/tramo/migrations/0001_initial.py`, `backend/apps/tramo/tests/test_modelo.py`; sumar factories a `backend/tests/factories.py`

**Interfaces:**
- Produces: modelos de §4.2 con `choices` y `CheckConstraint`s; `Cabina.objects.activas()`; factories `RutaFactory`, `CiudadFactory`, `CabinaFactory`, `ConcesionFactory`.

- [ ] **Step 1: Tests**

```python
# backend/apps/tramo/tests/test_modelo.py
import pytest
from django.db import IntegrityError
from apps.tramo.models import Cabina, Concesion, Ruta, TrazadoCiudad
from tests.factories import CabinaFactory, CiudadFactory, RutaFactory

@pytest.mark.django_db
def test_una_cabina_con_situacion_invalida_no_entra_a_la_base():
    with pytest.raises(IntegrityError):
        Cabina.objects.create(slug='x', nombre='X', ruta=RutaFactory(), localidad='L', provincia='P',
                              situacion='inventada', estado='confirmada', mapa_x=1, mapa_y=1)

@pytest.mark.django_db
def test_el_trazado_no_repite_orden_ni_ciudad_en_la_misma_ruta():
    ruta, c1, c2 = RutaFactory(), CiudadFactory(), CiudadFactory()
    TrazadoCiudad.objects.create(ruta=ruta, ciudad=c1, orden=1)
    with pytest.raises(IntegrityError):
        TrazadoCiudad.objects.create(ruta=ruta, ciudad=c2, orden=1)

@pytest.mark.django_db
def test_la_concesion_es_una_sola_fila():
    Concesion.objects.create(nombre='Tramo Centro', km_total=681.92)
    with pytest.raises(IntegrityError):
        Concesion.objects.create(nombre='Otra', km_total=1)

@pytest.mark.django_db
def test_activas_excluye_las_desactivadas():
    CabinaFactory(activa=True); CabinaFactory(activa=False)
    assert Cabina.objects.activas().count() == 1
```

- [ ] **Step 2: Modelos**

```python
# backend/apps/tramo/models.py
from django.db import models
from django.db.models import Q
from simple_history.models import HistoricalRecords


class Concesion(models.Model):
    """Fila única: datos generales del tramo concesionado."""
    singleton = models.BooleanField(default=True, unique=True, editable=False)
    nombre = models.CharField(max_length=80)
    km_total = models.DecimalField(max_digits=7, decimal_places=2)
    avisos = models.JSONField(default=list, blank=True)
    history = HistoricalRecords()

    class Meta:
        verbose_name = 'concesión'
        constraints = [models.CheckConstraint(condition=Q(singleton=True), name='concesion_unica')]

    @classmethod
    def actual(cls):
        return cls.objects.get()


class Ruta(models.Model):
    nombre = models.CharField(max_length=20, unique=True)  # "RN 9"
    descripcion = models.CharField(max_length=200)
    desde = models.CharField(max_length=200)
    hasta = models.CharField(max_length=200)
    km = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    nota = models.CharField(max_length=300, blank=True)
    orden = models.PositiveSmallIntegerField(default=0)
    activa = models.BooleanField(default=True)
    history = HistoricalRecords()

    class Meta:
        ordering = ['orden', 'nombre']

    def __str__(self):
        return self.nombre


class Ciudad(models.Model):
    slug = models.SlugField(max_length=60, unique=True)
    nombre = models.CharField(max_length=80)
    provincia = models.CharField(max_length=60)
    mapa_x = models.IntegerField()
    mapa_y = models.IntegerField()
    principal = models.BooleanField(default=False)
    history = HistoricalRecords()

    class Meta:
        ordering = ['nombre']
        verbose_name_plural = 'ciudades'


class TrazadoCiudad(models.Model):
    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='trazado')
    ciudad = models.ForeignKey(Ciudad, on_delete=models.PROTECT, related_name='+')
    orden = models.PositiveSmallIntegerField()

    class Meta:
        ordering = ['ruta', 'orden']
        constraints = [
            models.UniqueConstraint(fields=['ruta', 'orden'], name='trazado_orden_unico'),
            models.UniqueConstraint(fields=['ruta', 'ciudad'], name='trazado_ciudad_unica'),
        ]


class CabinaQuerySet(models.QuerySet):
    def activas(self):
        return self.filter(activa=True)


class Cabina(models.Model):
    class Situacion(models.TextChoices):
        EXISTENTE = 'existente'
        NUEVA = 'nueva'

    class Estado(models.TextChoices):
        CONFIRMADA = 'confirmada'
        A_CONFIRMAR = 'a-confirmar'

    slug = models.SlugField(max_length=60, unique=True)
    nombre = models.CharField(max_length=80)
    ruta = models.ForeignKey(Ruta, on_delete=models.PROTECT, related_name='cabinas')
    km = models.DecimalField(max_digits=7, decimal_places=2, null=True, blank=True)
    localidad = models.CharField(max_length=80)
    provincia = models.CharField(max_length=60)
    situacion = models.CharField(max_length=12, choices=Situacion.choices)
    estado = models.CharField(max_length=12, choices=Estado.choices)
    mapa_x = models.IntegerField()
    mapa_y = models.IntegerField()
    latitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    free_flow = models.BooleanField(default=False)
    operativa = models.BooleanField(default=False)
    fuente_nombre = models.CharField(max_length=120, blank=True)
    fuente_url = models.URLField(max_length=500, blank=True)
    orden = models.PositiveSmallIntegerField(default=0)
    activa = models.BooleanField(default=True)
    history = HistoricalRecords()
    objects = CabinaQuerySet.as_manager()

    class Meta:
        ordering = ['orden', 'nombre']
        indexes = [models.Index(fields=['ruta'])]
        constraints = [
            models.CheckConstraint(condition=Q(situacion__in=['existente', 'nueva']), name='cabina_situacion_valida'),
            models.CheckConstraint(condition=Q(estado__in=['confirmada', 'a-confirmar']), name='cabina_estado_valido'),
            models.CheckConstraint(condition=Q(fuente_url='') | Q(fuente_url__startswith='http'), name='cabina_fuente_http'),
        ]

    def __str__(self):
        return self.nombre
```

- [ ] **Step 3: Factories (agregar a `tests/factories.py`)**

```python
from apps.tramo.models import Cabina, Ciudad, Concesion, Ruta

class ConcesionFactory(factory.django.DjangoModelFactory):
    class Meta: model = Concesion
    nombre = 'Tramo Centro'; km_total = 681.92

class RutaFactory(factory.django.DjangoModelFactory):
    class Meta: model = Ruta
    nombre = factory.Sequence(lambda n: f'RN {n + 1}'); descripcion = 'Ruta'; desde = 'A'; hasta = 'B'

class CiudadFactory(factory.django.DjangoModelFactory):
    class Meta: model = Ciudad
    slug = factory.Sequence(lambda n: f'ciudad-{n}'); nombre = factory.Sequence(lambda n: f'Ciudad {n}')
    provincia = 'Córdoba'; mapa_x = 10; mapa_y = 10

class CabinaFactory(factory.django.DjangoModelFactory):
    class Meta: model = Cabina
    slug = factory.Sequence(lambda n: f'cabina-{n}'); nombre = factory.Sequence(lambda n: f'Cabina {n}')
    ruta = factory.SubFactory(RutaFactory); localidad = 'Localidad'; provincia = 'Córdoba'
    situacion = 'existente'; estado = 'confirmada'; mapa_x = 100; mapa_y = 100; activa = True
```

- [ ] **Step 4: `makemigrations tramo` → `pytest apps/tramo -v` → PASS. Commit: `feat(tramo): catálogo del tramo con restricciones en la base`**

### Task 5: `tarifario`: categorías, cuadro con exclusión de vigencias, tarifas con IVA calculado

**Files:**
- Create: `backend/apps/tarifario/models.py`, `backend/apps/tarifario/migrations/0001_initial.py`, `backend/apps/tarifario/tests/test_modelo.py`; factories `CategoriaFactory`, `CuadroFactory`, `TarifaFactory`

**Interfaces:**
- Produces: `CategoriaVehiculo`, `Cuadro` (estados `Cuadro.Estado`, permisos custom, `ExclusionConstraint`), `Tarifa` (`monto_con_iva` propiedad), `Cuadro.objects.vigente(fecha)`, `Cuadro.objects.proximo(fecha)`, función `redondear(monto, alicuota, redondeo) -> Decimal`.

- [ ] **Step 1: Tests**

```python
# backend/apps/tarifario/tests/test_modelo.py
from datetime import date
from decimal import Decimal
import pytest
from django.db import IntegrityError, transaction
from apps.tarifario.models import Cuadro, Tarifa, redondear
from tests.factories import CabinaFactory, CategoriaFactory, CuadroFactory, TarifaFactory

pytestmark = pytest.mark.django_db

def test_la_base_rechaza_dos_publicados_que_se_pisan():
    CuadroFactory(estado='publicado', vigencia_desde=date(2026, 10, 5), vigencia_hasta=None, publicado=True)
    with pytest.raises(IntegrityError), transaction.atomic():
        CuadroFactory(estado='publicado', vigencia_desde=date(2026, 11, 1), vigencia_hasta=None, publicado=True)

def test_dos_publicados_consecutivos_no_se_pisan():
    CuadroFactory(estado='publicado', vigencia_desde=date(2026, 10, 5), vigencia_hasta=date(2026, 10, 31), publicado=True)
    CuadroFactory(estado='publicado', vigencia_desde=date(2026, 11, 1), vigencia_hasta=None, publicado=True)
    assert Cuadro.objects.filter(estado='publicado').count() == 2

def test_un_borrador_puede_pisar_fechas_de_un_publicado():
    CuadroFactory(estado='publicado', vigencia_desde=date(2026, 10, 5), publicado=True)
    CuadroFactory(estado='borrador', vigencia_desde=date(2026, 10, 5))

def test_hasta_no_puede_ser_anterior_a_desde():
    with pytest.raises(IntegrityError), transaction.atomic():
        CuadroFactory(vigencia_desde=date(2026, 10, 5), vigencia_hasta=date(2026, 10, 1))

def test_una_sola_tarifa_general_por_categoria_y_cuadro():
    cuadro, cat = CuadroFactory(), CategoriaFactory()
    TarifaFactory(cuadro=cuadro, categoria=cat, cabina=None)
    with pytest.raises(IntegrityError), transaction.atomic():
        TarifaFactory(cuadro=cuadro, categoria=cat, cabina=None)

def test_una_excepcion_por_cabina_convive_con_la_general():
    cuadro, cat = CuadroFactory(), CategoriaFactory()
    TarifaFactory(cuadro=cuadro, categoria=cat, cabina=None)
    TarifaFactory(cuadro=cuadro, categoria=cat, cabina=CabinaFactory())

@pytest.mark.parametrize('monto,redondeo,esperado', [
    (Decimal('1399'), 'peso', Decimal('1693')),
    (Decimal('1399'), 'centavo', Decimal('1692.79')),
    (Decimal('0.50'), 'peso', Decimal('1')),
])
def test_iva_calculado_con_redondeo_half_up(monto, redondeo, esperado):
    assert redondear(monto, Decimal('0.210'), redondeo) == esperado

def test_vigente_y_proximo_por_fecha():
    viejo = CuadroFactory(estado='publicado', vigencia_desde=date(2026, 9, 6), vigencia_hasta=date(2026, 10, 31), publicado=True)
    nuevo = CuadroFactory(estado='publicado', vigencia_desde=date(2026, 11, 1), publicado=True)
    assert Cuadro.objects.vigente(date(2026, 10, 10)) == viejo
    assert Cuadro.objects.proximo(date(2026, 10, 10)) == nuevo
    assert Cuadro.objects.vigente(date(2026, 11, 1)) == nuevo
    assert Cuadro.objects.proximo(date(2026, 11, 1)) is None
```

- [ ] **Step 2: Modelos**

```python
# backend/apps/tarifario/models.py
from decimal import ROUND_HALF_UP, Decimal
from django.conf import settings
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import DateRangeField, RangeBoundary, RangeOperators
from django.db import models
from django.db.models import F, Func, Q, Value
from django.utils import timezone
from simple_history.models import HistoricalRecords
from apps.comun.archivos import validar_pdf, ruta_resolucion
from apps.tramo.models import Cabina


def redondear(monto_sin_iva: Decimal, alicuota: Decimal, redondeo: str) -> Decimal:
    """IVA calculado, nunca tipeado. 1399 × 1,21 = 1692,79 → 1693 al peso."""
    bruto = Decimal(monto_sin_iva) * (Decimal('1') + Decimal(alicuota))
    cuanto = Decimal('1') if redondeo == 'peso' else Decimal('0.01')
    return bruto.quantize(cuanto, rounding=ROUND_HALF_UP)


class RangoFechas(Func):
    """daterange(desde, hasta, '[]'); hasta NULL = abierto hacia el futuro."""
    function = 'daterange'
    output_field = DateRangeField()


class CategoriaVehiculo(models.Model):
    slug = models.SlugField(max_length=40, unique=True)
    nombre = models.CharField(max_length=80)
    descripcion = models.CharField(max_length=200)
    orden = models.PositiveSmallIntegerField(default=0)
    activa = models.BooleanField(default=True)
    history = HistoricalRecords()

    class Meta:
        ordering = ['orden']
        verbose_name = 'categoría de vehículo'
        verbose_name_plural = 'categorías de vehículo'

    def __str__(self):
        return self.nombre


class CuadroQuerySet(models.QuerySet):
    def publicados(self):
        return self.filter(estado=Cuadro.Estado.PUBLICADO)

    def vigente(self, fecha=None):
        fecha = fecha or timezone.localdate()
        return (self.publicados().filter(vigencia_desde__lte=fecha)
                .filter(Q(vigencia_hasta__isnull=True) | Q(vigencia_hasta__gte=fecha)).first())

    def proximo(self, fecha=None):
        fecha = fecha or timezone.localdate()
        return self.publicados().filter(vigencia_desde__gt=fecha).order_by('vigencia_desde').first()


class Cuadro(models.Model):
    class Estado(models.TextChoices):
        BORRADOR = 'borrador'
        EN_REVISION = 'en_revision', 'en revisión'
        PUBLICADO = 'publicado'
        ARCHIVADO = 'archivado'

    class Origen(models.TextChoices):
        OFERTA = 'oferta'
        HOMOLOGADA = 'homologada'

    class Redondeo(models.TextChoices):
        PESO = 'peso'
        CENTAVO = 'centavo'

    nombre = models.CharField(max_length=120)
    vigencia_desde = models.DateField(null=True, blank=True)  # obligatoria para publicar (servicio)
    vigencia_hasta = models.DateField(null=True, blank=True)
    vigencia_descripcion = models.CharField(max_length=300, blank=True)
    origen = models.CharField(max_length=12, choices=Origen.choices, default=Origen.OFERTA)
    alicuota_iva = models.DecimalField(max_digits=4, decimal_places=3, default=Decimal('0.210'))
    redondeo = models.CharField(max_length=8, choices=Redondeo.choices, default=Redondeo.PESO)
    fuente_nombre = models.CharField(max_length=200, blank=True)
    fuente_url = models.URLField(max_length=500, blank=True)
    resolucion = models.FileField(upload_to=ruta_resolucion, validators=[validar_pdf], null=True, blank=True)
    avisos = models.JSONField(default=list, blank=True)
    estado = models.CharField(max_length=12, choices=Estado.choices, default=Estado.BORRADOR)
    notas_internas = models.TextField(blank=True)
    creado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='+')
    creado_en = models.DateTimeField(auto_now_add=True)
    modificado_en = models.DateTimeField(auto_now=True)
    publicado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name='+')
    publicado_en = models.DateTimeField(null=True, blank=True)
    archivado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, null=True, blank=True, related_name='+')
    archivado_en = models.DateTimeField(null=True, blank=True)
    history = HistoricalRecords()
    objects = CuadroQuerySet.as_manager()

    class Meta:
        ordering = ['-vigencia_desde', '-creado_en']
        permissions = [('publicar_cuadro', 'Puede publicar un cuadro'), ('archivar_cuadro', 'Puede archivar un cuadro')]
        indexes = [models.Index(fields=['vigencia_desde'], name='cuadro_publicado_desde', condition=Q(estado='publicado'))]
        constraints = [
            models.CheckConstraint(condition=Q(vigencia_hasta__isnull=True) | Q(vigencia_hasta__gte=F('vigencia_desde')),
                                   name='cuadro_hasta_no_anterior_a_desde'),
            models.CheckConstraint(condition=~Q(estado='publicado') | (Q(publicado_en__isnull=False) & Q(vigencia_desde__isnull=False)),
                                   name='cuadro_publicado_completo'),
            models.CheckConstraint(condition=Q(fuente_url='') | Q(fuente_url__startswith='http'), name='cuadro_fuente_http'),
            ExclusionConstraint(
                name='cuadro_publicado_sin_solapamiento',
                expressions=[(RangoFechas(F('vigencia_desde'), F('vigencia_hasta'), Value('[]')), RangeOperators.OVERLAPS)],
                condition=Q(estado='publicado'),
            ),
        ]

    def __str__(self):
        return self.nombre

    @property
    def editable(self):
        return self.estado in (self.Estado.BORRADOR, self.Estado.EN_REVISION)


class Tarifa(models.Model):
    cuadro = models.ForeignKey(Cuadro, on_delete=models.CASCADE, related_name='tarifas')
    categoria = models.ForeignKey(CategoriaVehiculo, on_delete=models.PROTECT, related_name='+')
    cabina = models.ForeignKey(Cabina, on_delete=models.PROTECT, null=True, blank=True, related_name='+')
    monto_sin_iva = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    nota = models.CharField(max_length=200, blank=True)
    history = HistoricalRecords()

    class Meta:
        ordering = ['categoria__orden', 'cabina__orden']
        indexes = [models.Index(fields=['cuadro']), models.Index(fields=['categoria']), models.Index(fields=['cabina'])]
        constraints = [
            models.UniqueConstraint(fields=['cuadro', 'categoria', 'cabina'], nulls_distinct=False, name='tarifa_unica_por_cuadro_categoria_cabina'),
            models.CheckConstraint(condition=Q(monto_sin_iva__isnull=True) | Q(monto_sin_iva__gt=0), name='tarifa_monto_positivo'),
        ]

    @property
    def monto_con_iva(self):
        if self.monto_sin_iva is None:
            return None
        return redondear(self.monto_sin_iva, self.cuadro.alicuota_iva, self.cuadro.redondeo)
```

`apps/comun/archivos.py` con `validar_pdf` y `ruta_resolucion` se escribe en la Tarea 11; para que esta tarea compile, crear ahora el módulo con la firma definitiva (`def validar_pdf(archivo): ...` que valida extensión `.pdf`, tamaño ≤ 10 MB y firma `%PDF-`; `def ruta_resolucion(instancia, nombre): return f'resoluciones/{uuid4()}.pdf'`). La Tarea 11 le agrega los tests.

Nota sobre `RangeBoundary`: si `makemigrations` genera SQL sin el tercer argumento, usar `RangeBoundary()` en lugar de `Value('[]')` (es lo que documenta Django para `TsTzRange`); ambos producen `daterange(desde, hasta, '[]')`. Verificar con `sqlmigrate tarifario 0001` que aparezca `EXCLUDE USING gist (daterange(...) WITH &&) WHERE (estado = 'publicado')`.

- [ ] **Step 3: Factories**

```python
from apps.tarifario.models import CategoriaVehiculo, Cuadro, Tarifa

class CategoriaFactory(factory.django.DjangoModelFactory):
    class Meta: model = CategoriaVehiculo
    slug = factory.Sequence(lambda n: f'cat-{n + 1}'); nombre = factory.Sequence(lambda n: f'Categoría {n + 1}')
    descripcion = 'Descripción'; orden = factory.Sequence(int)

class CuadroFactory(factory.django.DjangoModelFactory):
    class Meta: model = Cuadro
    class Params:
        publicado = factory.Trait(estado='publicado', publicado_en=factory.LazyFunction(timezone.now),
                                  publicado_por=factory.SubFactory(UsuarioFactory), fuente_nombre='Res. 1379/2026',
                                  fuente_url='https://www.boletinoficial.gob.ar/', vigencia_descripcion='Vigente')
    nombre = factory.Sequence(lambda n: f'Cuadro {n}'); vigencia_desde = date(2026, 10, 5)
    creado_por = factory.SubFactory(UsuarioFactory)

class TarifaFactory(factory.django.DjangoModelFactory):
    class Meta: model = Tarifa
    cuadro = factory.SubFactory(CuadroFactory); categoria = factory.SubFactory(CategoriaFactory)
    cabina = None; monto_sin_iva = Decimal('1399')
```

- [ ] **Step 4: `makemigrations tarifario`, `sqlmigrate tarifario 0001 | grep -i exclude`, `pytest apps/tarifario -v` → PASS. Commit: `feat(tarifario): cuadros con exclusión de vigencias, tarifas con IVA calculado`**

### Task 6: Servicios del tarifario: publicar, archivar, duplicar, reemplazar grilla

**Files:**
- Create: `backend/apps/tarifario/servicios.py`, `backend/apps/comun/excepciones.py`, `backend/apps/tarifario/tests/test_servicios.py`

**Interfaces:**
- Produces:
  - `publicar_cuadro(cuadro: Cuadro, usuario) -> Cuadro` (cierra el anterior, respeta uno a futuro, marca publicado; lanza `ErrorDeNegocio` con `codigo` y `mensaje`).
  - `archivar_cuadro(cuadro, usuario) -> Cuadro`, `enviar_a_revision(cuadro, usuario)`, `volver_a_borrador(cuadro, usuario)`, `duplicar_cuadro(cuadro, usuario) -> Cuadro`.
  - `reemplazar_tarifas(cuadro, filas: list[dict], usuario, modificado_en_esperado) -> list[Tarifa]` (lanza `Conflicto` si el cuadro cambió o no es editable).
  - `ErrorDeNegocio(Exception)`: `.codigo`, `.mensaje`; `Conflicto(ErrorDeNegocio)`.

- [ ] **Step 1: Tests**

```python
# backend/apps/tarifario/tests/test_servicios.py
from datetime import date, timedelta
from decimal import Decimal
import pytest
from apps.tarifario import servicios
from apps.comun.excepciones import Conflicto, ErrorDeNegocio
from apps.tarifario.models import Cuadro
from tests.factories import CabinaFactory, CategoriaFactory, CuadroFactory, TarifaFactory, UsuarioFactory

pytestmark = pytest.mark.django_db

def cuadro_completo(**kw):
    cuadro = CuadroFactory(estado='en_revision', fuente_nombre='Res.', fuente_url='https://x.gob.ar', vigencia_descripcion='Vigente', **kw)
    for cat in CategoriaFactory.create_batch(2):
        TarifaFactory(cuadro=cuadro, categoria=cat)
    return cuadro

def test_publicar_cierra_el_anterior_el_dia_previo():
    usuario = UsuarioFactory(grupo='Publicación')
    viejo = CuadroFactory(estado='publicado', vigencia_desde=date(2026, 9, 6), publicado=True)
    nuevo = cuadro_completo(vigencia_desde=date(2026, 11, 1))
    servicios.publicar_cuadro(nuevo, usuario)
    viejo.refresh_from_db(); nuevo.refresh_from_db()
    assert viejo.vigencia_hasta == date(2026, 10, 31)
    assert nuevo.estado == 'publicado' and nuevo.publicado_por == usuario and nuevo.publicado_en

def test_publicar_antes_de_uno_a_futuro_lo_respeta():
    futuro = CuadroFactory(estado='publicado', vigencia_desde=date(2027, 1, 1), publicado=True)
    nuevo = cuadro_completo(vigencia_desde=date(2026, 11, 1))
    servicios.publicar_cuadro(nuevo, UsuarioFactory())
    nuevo.refresh_from_db()
    assert nuevo.vigencia_hasta == date(2026, 12, 31)

def test_no_se_publica_sin_fila_general_para_cada_categoria_activa():
    cuadro = cuadro_completo(vigencia_desde=date(2026, 11, 1))
    CategoriaFactory()  # una categoría sin tarifa
    with pytest.raises(ErrorDeNegocio) as e:
        servicios.publicar_cuadro(cuadro, UsuarioFactory())
    assert e.value.codigo == 'categoria_sin_tarifa'

def test_no_se_publica_con_la_misma_fecha_que_otro_publicado():
    CuadroFactory(estado='publicado', vigencia_desde=date(2026, 11, 1), publicado=True)
    with pytest.raises(ErrorDeNegocio) as e:
        servicios.publicar_cuadro(cuadro_completo(vigencia_desde=date(2026, 11, 1)), UsuarioFactory())
    assert e.value.codigo == 'misma_fecha_que_otro_publicado'

def test_archivar_libera_el_rango():
    usuario = UsuarioFactory()
    viejo = CuadroFactory(estado='publicado', vigencia_desde=date(2026, 11, 1), publicado=True)
    servicios.archivar_cuadro(viejo, usuario)
    nuevo = cuadro_completo(vigencia_desde=date(2026, 11, 1))
    servicios.publicar_cuadro(nuevo, usuario)
    assert Cuadro.objects.vigente(date(2026, 11, 2)) == nuevo

def test_duplicar_crea_un_borrador_con_las_mismas_tarifas_y_sin_fecha():
    original = CuadroFactory(estado='publicado', vigencia_desde=date(2026, 11, 1), publicado=True)
    TarifaFactory(cuadro=original); TarifaFactory(cuadro=original, cabina=CabinaFactory())
    copia = servicios.duplicar_cuadro(original, UsuarioFactory())
    assert copia.estado == 'borrador' and copia.vigencia_desde is None and copia.tarifas.count() == 2

def test_reemplazar_tarifas_rechaza_si_el_cuadro_cambio_en_el_medio():
    cuadro = cuadro_completo()
    viejo_modificado_en = cuadro.modificado_en - timedelta(seconds=5)
    with pytest.raises(Conflicto):
        servicios.reemplazar_tarifas(cuadro, [], UsuarioFactory(), viejo_modificado_en)

def test_reemplazar_tarifas_rechaza_un_publicado():
    cuadro = CuadroFactory(estado='publicado', publicado=True)
    with pytest.raises(Conflicto):
        servicios.reemplazar_tarifas(cuadro, [], UsuarioFactory(), cuadro.modificado_en)

def test_reemplazar_tarifas_escribe_la_grilla_y_deja_historial():
    cuadro, cat = cuadro_completo(), CategoriaFactory()
    filas = [{'categoria': cat.slug, 'cabina': None, 'monto_sin_iva': Decimal('1500'), 'nota': ''}]
    tarifas = servicios.reemplazar_tarifas(cuadro, filas, UsuarioFactory(), cuadro.modificado_en)
    assert len(tarifas) == 1 and tarifas[0].history.count() == 1
```

- [ ] **Step 2: Implementación**

```python
# backend/apps/comun/excepciones.py  (la Tarea 10 le agrega el manejador de DRF)
class ErrorDeNegocio(Exception):
    def __init__(self, codigo: str, mensaje: str):
        super().__init__(mensaje)
        self.codigo, self.mensaje = codigo, mensaje

class Conflicto(ErrorDeNegocio):
    """El recurso cambió o no admite la operación en su estado actual (HTTP 409)."""
```

```python
# backend/apps/tarifario/servicios.py
from datetime import timedelta
from django.db import transaction
from django.utils import timezone
from simple_history.utils import bulk_create_with_history
from apps.comun.excepciones import Conflicto, ErrorDeNegocio
from apps.tarifario.models import CategoriaVehiculo, Cuadro, Tarifa
from apps.tramo.models import Cabina

def maximo_filas() -> int:
    return CategoriaVehiculo.objects.count() * (Cabina.objects.count() + 1)


def _bloquear(cuadro: Cuadro) -> Cuadro:
    return Cuadro.objects.select_for_update().get(pk=cuadro.pk)


def _validar_publicable(cuadro: Cuadro):
    if cuadro.estado != Cuadro.Estado.EN_REVISION:
        raise Conflicto('estado_invalido', 'Solo se publica un cuadro en revisión.')
    if not cuadro.vigencia_desde:
        raise ErrorDeNegocio('sin_vigencia', 'Cargá la fecha desde la que rige el cuadro.')
    if not (cuadro.fuente_nombre and cuadro.fuente_url and cuadro.vigencia_descripcion):
        raise ErrorDeNegocio('sin_fuente', 'Cargá la fuente, su link y la descripción de la vigencia.')
    generales = set(cuadro.tarifas.filter(cabina__isnull=True).values_list('categoria_id', flat=True))
    faltan = CategoriaVehiculo.objects.filter(activa=True).exclude(id__in=generales)
    if faltan.exists():
        raise ErrorDeNegocio('categoria_sin_tarifa', f'Falta la tarifa general de: {", ".join(c.nombre for c in faltan)}.')
    if cuadro.tarifas.filter(cabina__activa=False).exists():
        raise ErrorDeNegocio('cabina_inactiva', 'Hay excepciones sobre cabinas desactivadas.')
    if Cuadro.objects.publicados().filter(vigencia_desde=cuadro.vigencia_desde).exists():
        raise Conflicto('misma_fecha_que_otro_publicado', 'Ya hay un cuadro publicado con esa fecha: archivalo primero.')


@transaction.atomic
def publicar_cuadro(cuadro: Cuadro, usuario) -> Cuadro:
    cuadro = _bloquear(cuadro)
    _validar_publicable(cuadro)
    anterior = (Cuadro.objects.select_for_update().publicados()
                .filter(vigencia_desde__lt=cuadro.vigencia_desde, vigencia_hasta__isnull=True).first())
    if anterior:
        anterior.vigencia_hasta = cuadro.vigencia_desde - timedelta(days=1)
        anterior.save(update_fields=['vigencia_hasta', 'modificado_en'])
    futuro = Cuadro.objects.publicados().filter(vigencia_desde__gt=cuadro.vigencia_desde).order_by('vigencia_desde').first()
    cuadro.vigencia_hasta = futuro.vigencia_desde - timedelta(days=1) if futuro else None
    cuadro.estado = Cuadro.Estado.PUBLICADO
    cuadro.publicado_por, cuadro.publicado_en = usuario, timezone.now()
    cuadro.save()  # la ExclusionConstraint es la última línea de defensa
    return cuadro


@transaction.atomic
def archivar_cuadro(cuadro: Cuadro, usuario) -> Cuadro:
    cuadro = _bloquear(cuadro)
    if cuadro.estado != Cuadro.Estado.PUBLICADO:
        raise Conflicto('estado_invalido', 'Solo se archiva un cuadro publicado.')
    cuadro.estado, cuadro.archivado_por, cuadro.archivado_en = Cuadro.Estado.ARCHIVADO, usuario, timezone.now()
    cuadro.save()
    return cuadro


@transaction.atomic
def enviar_a_revision(cuadro: Cuadro, usuario) -> Cuadro:
    cuadro = _bloquear(cuadro)
    if cuadro.estado != Cuadro.Estado.BORRADOR:
        raise Conflicto('estado_invalido', 'Solo un borrador se manda a revisión.')
    cuadro.estado = Cuadro.Estado.EN_REVISION
    cuadro.save()
    return cuadro


@transaction.atomic
def volver_a_borrador(cuadro: Cuadro, usuario) -> Cuadro:
    cuadro = _bloquear(cuadro)
    if cuadro.estado != Cuadro.Estado.EN_REVISION:
        raise Conflicto('estado_invalido', 'Solo un cuadro en revisión vuelve a borrador.')
    cuadro.estado = Cuadro.Estado.BORRADOR
    cuadro.save()
    return cuadro


@transaction.atomic
def duplicar_cuadro(cuadro: Cuadro, usuario) -> Cuadro:
    copia = Cuadro.objects.create(
        nombre=f'{cuadro.nombre} (copia)', vigencia_desde=None, vigencia_hasta=None,
        vigencia_descripcion=cuadro.vigencia_descripcion, origen=cuadro.origen, alicuota_iva=cuadro.alicuota_iva,
        redondeo=cuadro.redondeo, fuente_nombre=cuadro.fuente_nombre, fuente_url=cuadro.fuente_url,
        avisos=list(cuadro.avisos), creado_por=usuario,
    )
    bulk_create_with_history(
        [Tarifa(cuadro=copia, categoria_id=t.categoria_id, cabina_id=t.cabina_id, monto_sin_iva=t.monto_sin_iva, nota=t.nota)
         for t in cuadro.tarifas.all()], Tarifa, default_user=usuario)
    return copia


@transaction.atomic
def reemplazar_tarifas(cuadro: Cuadro, filas: list[dict], usuario, modificado_en_esperado) -> list[Tarifa]:
    cuadro = _bloquear(cuadro)
    if not cuadro.editable:
        raise Conflicto('estado_invalido', 'Un cuadro publicado o archivado no se edita: duplicalo.')
    if modificado_en_esperado is None or abs((cuadro.modificado_en - modificado_en_esperado).total_seconds()) > 0.001:
        raise Conflicto('cuadro_modificado', 'Otra persona guardó este cuadro mientras lo editabas. Recargá y volvé a intentar.')
    if len(filas) > maximo_filas():
        raise ErrorDeNegocio('demasiadas_filas', 'La grilla tiene más filas que categorías por cabinas.')
    categorias = {c.slug: c for c in CategoriaVehiculo.objects.filter(activa=True)}
    cabinas = {c.slug: c for c in Cabina.objects.activas()}
    nuevas = []
    for fila in filas:
        if fila['categoria'] not in categorias:
            raise ErrorDeNegocio('categoria_invalida', f'Categoría desconocida o inactiva: {fila["categoria"]}.')
        cabina = None
        if fila.get('cabina'):
            if fila['cabina'] not in cabinas:
                raise ErrorDeNegocio('cabina_invalida', f'Cabina desconocida o inactiva: {fila["cabina"]}.')
            cabina = cabinas[fila['cabina']]
        nuevas.append(Tarifa(cuadro=cuadro, categoria=categorias[fila['categoria']], cabina=cabina,
                             monto_sin_iva=fila.get('monto_sin_iva'), nota=fila.get('nota', '')))
    cuadro.tarifas.all().delete()
    creadas = bulk_create_with_history(nuevas, Tarifa, default_user=usuario)
    cuadro.save(update_fields=['modificado_en'])
    return creadas
```

- [ ] **Step 3: `pytest apps/tarifario -v` → PASS. Commit: `feat(tarifario): servicios de publicación, archivo, duplicado y grilla con concurrencia optimista`**

### Task 7: `publicacion`: registro del aviso a la web y servicio `avisar_web`

**Files:**
- Create: `backend/apps/publicacion/models.py`, `migrations/0001_initial.py`, `backend/apps/publicacion/servicios.py`, `backend/apps/publicacion/tests/test_avisar_web.py`

**Interfaces:**
- Produces: `Publicacion` (genérica: `content_type`, `object_id`, `usuario`, `fecha`, `accion`, `resultado_aviso`, `detalle`, `avisado_en`); `registrar_y_avisar(objeto, usuario, accion) -> Publicacion`; `reintentar(publicacion, usuario) -> Publicacion`; `limpiar_detalle(texto) -> str`.

- [ ] **Step 1: Tests**

```python
# backend/apps/publicacion/tests/test_avisar_web.py
import pytest, responses
from django.test import override_settings
from apps.publicacion import servicios
from apps.publicacion.models import Publicacion
from tests.factories import CuadroFactory, UsuarioFactory

pytestmark = pytest.mark.django_db
URL = 'https://api.github.com/repos/JuliV08/Covicen/dispatches'

@responses.activate
@override_settings(GITHUB_DISPATCH_TOKEN='github_pat_ABC123')
def test_aviso_ok_queda_registrado():
    responses.post(URL, status=204)
    p = servicios.registrar_y_avisar(CuadroFactory(), UsuarioFactory(), 'publicar')
    assert p.resultado_aviso == 'ok' and p.avisado_en is not None
    assert responses.calls[0].request.headers['Authorization'] == 'Bearer github_pat_ABC123'
    assert b'"event_type": "datos-publicados"' in responses.calls[0].request.body

@responses.activate
@override_settings(GITHUB_DISPATCH_TOKEN='github_pat_ABC123')
def test_aviso_con_error_guarda_el_detalle_sin_el_token():
    responses.post(URL, status=401, body='Bad credentials github_pat_ABC123 ' + 'x' * 2000)
    p = servicios.registrar_y_avisar(CuadroFactory(), UsuarioFactory(), 'publicar')
    assert p.resultado_aviso == 'error'
    assert 'github_pat_ABC123' not in p.detalle and len(p.detalle) <= 560 and p.detalle.startswith('401')

@override_settings(GITHUB_DISPATCH_TOKEN='')
def test_sin_token_el_aviso_se_omite():
    p = servicios.registrar_y_avisar(CuadroFactory(), UsuarioFactory(), 'publicar')
    assert p.resultado_aviso == 'omitido'

@override_settings(GITHUB_DISPATCH_TOKEN='x', GITHUB_DISPATCH_REPO='../evil')
def test_repo_invalido_no_manda_nada():
    p = servicios.registrar_y_avisar(CuadroFactory(), UsuarioFactory(), 'publicar')
    assert p.resultado_aviso == 'error' and 'GITHUB_DISPATCH_REPO' in p.detalle

@responses.activate
@override_settings(GITHUB_DISPATCH_TOKEN='x')
def test_reintentar_crea_otra_publicacion():
    responses.post(URL, status=204)
    original = Publicacion.objects.create(objeto=CuadroFactory(), usuario=UsuarioFactory(), accion='publicar', resultado_aviso='error')
    nueva = servicios.reintentar(original, UsuarioFactory())
    assert nueva.accion == 'reintento' and nueva.resultado_aviso == 'ok' and Publicacion.objects.count() == 2
```

- [ ] **Step 2: Modelo y servicio**

```python
# backend/apps/publicacion/models.py
from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models


class Publicacion(models.Model):
    class Accion(models.TextChoices):
        PUBLICAR = 'publicar'; ARCHIVAR = 'archivar'; REINTENTO = 'reintento'

    class Resultado(models.TextChoices):
        PENDIENTE = 'pendiente'; OK = 'ok'; ERROR = 'error'; OMITIDO = 'omitido'

    content_type = models.ForeignKey(ContentType, on_delete=models.PROTECT)
    object_id = models.PositiveBigIntegerField()
    objeto = GenericForeignKey('content_type', 'object_id')
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name='+')
    fecha = models.DateTimeField(auto_now_add=True)
    accion = models.CharField(max_length=10, choices=Accion.choices)
    resultado_aviso = models.CharField(max_length=10, choices=Resultado.choices, default=Resultado.PENDIENTE)
    detalle = models.TextField(blank=True)
    avisado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'publicación'
        verbose_name_plural = 'publicaciones'
        indexes = [models.Index(fields=['content_type', 'object_id', '-fecha'])]
```

```python
# backend/apps/publicacion/servicios.py
import re
import requests
from django.conf import settings
from django.utils import timezone
from apps.publicacion.models import Publicacion

API_GITHUB = 'https://api.github.com'
REPO_VALIDO = re.compile(r'^[\w.-]+/[\w.-]+$')
TOKEN = re.compile(r'(gh[pousr]_[A-Za-z0-9_]+|github_pat_[A-Za-z0-9_]+)')
EVENTO = 'datos-publicados'


def limpiar_detalle(texto: str) -> str:
    return TOKEN.sub('[token]', texto or '')[:500]


def _avisar(payload: dict) -> tuple[str, str]:
    token, repo = settings.GITHUB_DISPATCH_TOKEN, settings.GITHUB_DISPATCH_REPO
    if not token:
        return Publicacion.Resultado.OMITIDO, 'Sin GITHUB_DISPATCH_TOKEN: la web no se reconstruye sola en este entorno.'
    if not REPO_VALIDO.match(repo or ''):
        return Publicacion.Resultado.ERROR, 'GITHUB_DISPATCH_REPO inválido.'
    try:
        r = requests.post(f'{API_GITHUB}/repos/{repo}/dispatches',
                          json={'event_type': EVENTO, 'client_payload': payload},
                          headers={'Authorization': f'Bearer {token}', 'Accept': 'application/vnd.github+json',
                                   'X-GitHub-Api-Version': '2022-11-28'}, timeout=10)
    except requests.RequestException as e:
        return Publicacion.Resultado.ERROR, limpiar_detalle(f'sin respuesta: {e.__class__.__name__}')
    if r.status_code == 204:
        return Publicacion.Resultado.OK, ''
    return Publicacion.Resultado.ERROR, limpiar_detalle(f'{r.status_code} {r.text}')


def registrar_y_avisar(objeto, usuario, accion: str) -> Publicacion:
    publicacion = Publicacion.objects.create(objeto=objeto, usuario=usuario, accion=accion)
    resultado, detalle = _avisar({'modelo': objeto._meta.label_lower, 'id': objeto.pk, 'publicacion': publicacion.pk})
    publicacion.resultado_aviso, publicacion.detalle = resultado, detalle
    publicacion.avisado_en = timezone.now() if resultado == Publicacion.Resultado.OK else None
    publicacion.save(update_fields=['resultado_aviso', 'detalle', 'avisado_en'])
    return publicacion


def reintentar(publicacion: Publicacion, usuario) -> Publicacion:
    return registrar_y_avisar(publicacion.objeto, usuario, Publicacion.Accion.REINTENTO)
```

- [ ] **Step 3: `makemigrations publicacion`, luego crear `cuentas/0002_grupos.py` (Tarea 3, Step 3) y `migrate`; `pytest` completo → PASS. Commit: `feat(publicacion): registro del aviso a la web con reintento y filtro de tokens`**

**Cierre de la Fase A:** `rev-bro` revisa Tareas 3 a 7 contra la spec §4 y §5 con `pytest`, `ruff` y `makemigrations --check` en verde. Bloqueantes se arreglan antes de la Fase B.

---

## Fase B — APIs (pública y del panel), archivos, demo, CI del backend

### Task 8: Exportar el contrato de la landing como JSON Schema (repo `Covicen`)

**Files:**
- Modify: `Covicen/src/lib/datos/esquemas.ts` (dos campos opcionales), `Covicen/package.json` (script `contrato`)
- Create: `Covicen/scripts/exportar-contrato.ts`, `Covicen/docs/contrato/tramo.schema.json`, `Covicen/docs/contrato/tarifario.schema.json`, `Covicen/tests/datos/contrato.test.ts`

**Interfaces:**
- Produces: `docs/contrato/{tramo,tarifario}.schema.json` (JSON Schema draft 2020-12) en `main` del repo público, que el backend descarga en CI. `esquemaTarifa.montoConIva?: number | null`, `esquemaCabina.freeFlow?: boolean`.

- [ ] **Step 1: Test que falla (el archivo commiteado tiene que coincidir con la exportación)**

```ts
// Covicen/tests/datos/contrato.test.ts
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { exportarContrato } from '../../scripts/exportar-contrato';

describe('contrato exportado', () => {
  it('los JSON Schema commiteados coinciden con los esquemas Zod', () => {
    for (const [nombre, schema] of Object.entries(exportarContrato())) {
      const enDisco = JSON.parse(readFileSync(`docs/contrato/${nombre}.schema.json`, 'utf8'));
      expect(enDisco).toEqual(schema);
    }
  });
});
```

- [ ] **Step 2: Contrato y script**

```ts
// en esquemas.ts: dentro de esquemaTarifa, después de montoSinIva
  montoConIva: z.number().positive().nullable().optional(),
// dentro de esquemaCabina, después de situacion/estado
  freeFlow: z.boolean().optional(),
```

```ts
// Covicen/scripts/exportar-contrato.ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { z } from 'astro/zod';
import { esquemaTarifario, esquemaTramo } from '../src/lib/datos/esquemas';

/** Los esquemas Zod del front son EL contrato; esto es su forma portable para el backend. */
export function exportarContrato(): Record<string, unknown> {
  return {
    tramo: z.toJSONSchema(esquemaTramo, { target: 'draft-2020-12' }),
    tarifario: z.toJSONSchema(esquemaTarifario, { target: 'draft-2020-12' }),
  };
}

if (process.argv[1]?.endsWith('exportar-contrato.ts')) {
  mkdirSync('docs/contrato', { recursive: true });
  for (const [nombre, schema] of Object.entries(exportarContrato())) {
    writeFileSync(`docs/contrato/${nombre}.schema.json`, JSON.stringify(schema, null, 2) + '\n');
  }
  console.log('Contrato exportado a docs/contrato/');
}
```

`package.json`: `"contrato": "node scripts/exportar-contrato.ts"`.

- [ ] **Step 3: `pnpm contrato && pnpm test tests/datos/contrato.test.ts && pnpm check`** → PASS. Si `z.toJSONSchema` rechaza `z.literal('Covicen')` o los regex, ajustar con `unrepresentable: 'any'` y anotarlo en el script. Commit en `Covicen`: `feat(contrato): JSON Schema exportado de los esquemas Zod + montoConIva y freeFlow opcionales`

### Task 9: API pública `/api/v1/` con contrato validado

**Files:**
- Create: `backend/apps/comun/api_publica.py` (mixin), `backend/apps/comun/throttles.py`, `backend/apps/tramo/api_publica.py`, `backend/apps/tramo/serializers_publica.py`, `backend/apps/tramo/urls_publica.py`, `backend/apps/tarifario/api_publica.py`, `backend/apps/tarifario/serializers_publica.py`, `backend/apps/tarifario/urls_publica.py`, `backend/apps/tarifario/tests/test_api_publica.py`, `backend/tests/contrato/test_contrato.py`, `backend/tests/contrato/descargar.py`

**Interfaces:**
- Consumes: `Cuadro.objects.vigente/proximo`, `Concesion.actual()`, `Tarifa.monto_con_iva`.
- Produces: `GET /api/v1/tramo/`, `/api/v1/tarifario/?fecha=&cabina=`, `/api/v1/tarifario/cuadros/`, `/api/v1/tarifario/cuadros/{id}/`, `/api/v1/cabinas/`, `/api/v1/categorias/`, `/api/v1/salud/`; `ApiPublicaMixin` (sin auth, throttle, caché, ETag); función `datos_tarifario(cuadro, cabina=None, hoy=None) -> dict` con la forma del contrato.

- [ ] **Step 1: Tests de comportamiento**

```python
# backend/apps/tarifario/tests/test_api_publica.py
from datetime import date
from decimal import Decimal
import pytest
from tests.factories import CabinaFactory, CategoriaFactory, ConcesionFactory, CuadroFactory, TarifaFactory

pytestmark = pytest.mark.django_db

def publicado(desde, hasta=None, **kw):
    return CuadroFactory(estado='publicado', publicado=True, vigencia_desde=desde, vigencia_hasta=hasta, **kw)

def test_tarifario_vigente_con_iva_y_sin_autenticacion(cliente):
    cat = CategoriaFactory(slug='cat-2', nombre='Autos')
    TarifaFactory(cuadro=publicado(date(2026, 9, 1)), categoria=cat, monto_sin_iva=Decimal('1399'))
    r = cliente.get('/api/v1/tarifario/?fecha=2026-10-10')
    assert r.status_code == 200
    assert r['Cache-Control'] == 'public, max-age=300' and r['Vary'] == 'Accept-Encoding' and r.has_header('ETag')
    t = r.json()['tarifas'][0]
    assert t['categoria'] == 'cat-2' and t['montoSinIva'] == 1399 and t['montoConIva'] == 1693

def test_sin_vigente_es_404_sin_cache(cliente):
    r = cliente.get('/api/v1/tarifario/?fecha=2020-01-01')
    assert r.status_code == 404 and r['Cache-Control'] == 'no-store'

def test_el_proximo_agrega_un_aviso(cliente):
    cat = CategoriaFactory()
    TarifaFactory(cuadro=publicado(date(2026, 9, 1), date(2026, 10, 31)), categoria=cat)
    TarifaFactory(cuadro=publicado(date(2026, 11, 1)), categoria=cat)
    avisos = cliente.get('/api/v1/tarifario/?fecha=2026-10-10').json()['avisos']
    assert any('1/11/2026' in a for a in avisos)

def test_excepcion_por_cabina(cliente):
    cat, cabina = CategoriaFactory(), CabinaFactory(slug='leones')
    cuadro = publicado(date(2026, 9, 1))
    TarifaFactory(cuadro=cuadro, categoria=cat, monto_sin_iva=Decimal('1399'))
    TarifaFactory(cuadro=cuadro, categoria=cat, cabina=cabina, monto_sin_iva=Decimal('999'))
    assert cliente.get('/api/v1/tarifario/?fecha=2026-10-10').json()['tarifas'][0]['montoSinIva'] == 1399
    assert cliente.get('/api/v1/tarifario/?fecha=2026-10-10&cabina=leones').json()['tarifas'][0]['montoSinIva'] == 999

@pytest.mark.parametrize('qs', ['?fecha=ayer', '?fecha=1900-01-01', '?cabina=Leones!', '?cabina=' + 'a' * 80])
def test_parametros_invalidos_son_400(cliente, qs):
    assert cliente.get('/api/v1/tarifario/' + qs).status_code == 400

def test_tramo_con_provincias_derivadas_y_cabinas_activas(cliente):
    ConcesionFactory(avisos=['Aviso'])
    CabinaFactory(provincia='Santa Fe', activa=True); CabinaFactory(provincia='Córdoba', activa=False)
    d = cliente.get('/api/v1/tramo/').json()
    assert d['km'] == 681.92 and d['provincias'] == ['Santa Fe'] and len(d['cabinas']) == 1

def test_salud_no_expone_version(cliente):
    assert cliente.get('/api/v1/salud/').json() == {'estado': 'ok'}

def test_notas_internas_no_salen(cliente):
    cuadro = publicado(date(2026, 9, 1), notas_internas='secreto')
    assert 'secreto' not in cliente.get(f'/api/v1/tarifario/cuadros/{cuadro.id}/').content.decode()
```

- [ ] **Step 2: Mixin público, throttles y vistas**

```python
# backend/apps/comun/throttles.py
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
class PublicaThrottle(AnonRateThrottle):
    scope = 'anon'
class ReintentoThrottle(UserRateThrottle):
    scope = 'reintento'
```

```python
# backend/apps/comun/api_publica.py
import hashlib
import json
from django.utils.cache import patch_vary_headers
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.comun.throttles import PublicaThrottle


class ApiPublicaMixin:
    """Solo lectura, sin credenciales, cacheable. Nunca hereda las clases de auth por defecto."""
    authentication_classes = []
    permission_classes = []
    throttle_classes = [PublicaThrottle]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        if response.status_code == 200 and request.method == 'GET':
            response['Cache-Control'] = 'public, max-age=300'
            cuerpo = json.dumps(getattr(response, 'data', None), sort_keys=True, default=str).encode()
            response['ETag'] = '"' + hashlib.sha256(request.get_full_path().encode() + cuerpo).hexdigest()[:32] + '"'
        else:
            response['Cache-Control'] = 'no-store'
        patch_vary_headers(response, ['Accept-Encoding'])
        return response


class SaludView(ApiPublicaMixin, APIView):
    def get(self, request):
        return Response({'estado': 'ok'})
```

```python
# backend/apps/tarifario/serializers_publica.py
from datetime import date
from decimal import Decimal
from apps.tarifario.models import CategoriaVehiculo, Cuadro


def _numero(d: Decimal | None):
    return None if d is None else float(d)


def datos_tarifario(cuadro: Cuadro, cabina=None, hoy: date | None = None) -> dict:
    """La forma EXACTA de esquemaTarifario (contrato del front)."""
    hoy = hoy or date.today()
    generales = {t.categoria_id: t for t in cuadro.tarifas.filter(cabina__isnull=True).select_related('categoria')}
    if cabina is not None:
        for t in cuadro.tarifas.filter(cabina=cabina).select_related('categoria'):
            generales[t.categoria_id] = t
    tarifas = []
    for cat in CategoriaVehiculo.objects.filter(activa=True).order_by('orden'):
        t = generales.get(cat.id)
        fila = {'categoria': cat.slug, 'nombre': cat.nombre, 'descripcion': cat.descripcion,
                'montoSinIva': _numero(t.monto_sin_iva) if t else None,
                'montoConIva': _numero(t.monto_con_iva) if t else None}
        if t and t.nota:
            fila['nota'] = t.nota
        tarifas.append(fila)
    avisos = list(cuadro.avisos)
    proximo = Cuadro.objects.proximo(hoy)
    if proximo and proximo.pk != cuadro.pk:
        d = proximo.vigencia_desde
        avisos.append(f'A partir del {d.day}/{d.month}/{d.year} rige un cuadro tarifario nuevo.')
    return {
        'publicadoEl': cuadro.publicado_en.date().isoformat(),
        'vigencia': {'desde': cuadro.vigencia_desde.isoformat(), 'descripcion': cuadro.vigencia_descripcion},
        'moneda': 'ARS', 'alicuotaIva': float(cuadro.alicuota_iva), 'origen': cuadro.origen,
        'tarifas': tarifas, 'fuente': {'nombre': cuadro.fuente_nombre, 'url': cuadro.fuente_url}, 'avisos': avisos,
    }
```

```python
# backend/apps/tarifario/api_publica.py
import re
from datetime import date, timedelta
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView
from apps.comun.api_publica import ApiPublicaMixin
from apps.tarifario.models import CategoriaVehiculo, Cuadro
from apps.tarifario.serializers_publica import datos_tarifario
from apps.tramo.models import Cabina

SLUG = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')


class ParametrosTarifario(serializers.Serializer):
    fecha = serializers.DateField(required=False)
    cabina = serializers.RegexField(SLUG, max_length=60, required=False)

    def validate_fecha(self, f):
        if abs((f - date.today()).days) > 5 * 366:
            raise serializers.ValidationError('Fecha fuera de rango.')
        return f


class TarifarioVigenteView(ApiPublicaMixin, APIView):
    def get(self, request):
        p = ParametrosTarifario(data=request.query_params)
        p.is_valid(raise_exception=True)
        hoy = p.validated_data.get('fecha') or date.today()
        cabina = get_object_or_404(Cabina.objects.activas(), slug=p.validated_data['cabina']) if 'cabina' in p.validated_data else None
        cuadro = Cuadro.objects.vigente(hoy)
        if cuadro is None:
            return Response({'detail': 'No hay un cuadro tarifario vigente para esa fecha.'}, status=404)
        return Response(datos_tarifario(cuadro, cabina, hoy))


class CuadroResumenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cuadro
        fields = ['id', 'nombre', 'vigencia_desde', 'vigencia_hasta', 'origen', 'estado', 'publicado_en']
        read_only_fields = fields


class CuadrosPublicadosView(ApiPublicaMixin, ListAPIView):
    serializer_class = CuadroResumenSerializer
    def get_queryset(self):
        return Cuadro.objects.filter(estado__in=['publicado', 'archivado']).order_by('-vigencia_desde')


class CuadroPublicadoView(ApiPublicaMixin, RetrieveAPIView):
    def get_queryset(self):
        return Cuadro.objects.filter(estado__in=['publicado', 'archivado'])
    def retrieve(self, request, *args, **kwargs):
        cuadro = self.get_object()
        datos = datos_tarifario(cuadro, None, cuadro.vigencia_desde)
        datos['excepciones'] = [
            {'cabina': t.cabina.slug, 'categoria': t.categoria.slug, 'montoSinIva': float(t.monto_sin_iva) if t.monto_sin_iva is not None else None}
            for t in cuadro.tarifas.filter(cabina__isnull=False).select_related('cabina', 'categoria')]
        return Response(datos)


class CategoriaPublicaSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriaVehiculo
        fields = ['slug', 'nombre', 'descripcion', 'orden']
        read_only_fields = fields


class CategoriasView(ApiPublicaMixin, ListAPIView):
    serializer_class = CategoriaPublicaSerializer
    pagination_class = None
    def get_queryset(self):
        return CategoriaVehiculo.objects.filter(activa=True)
```

```python
# backend/apps/tarifario/urls_publica.py
from django.urls import path
from apps.comun.api_publica import SaludView
from apps.tarifario import api_publica as v
urlpatterns = [
    path('tarifario/', v.TarifarioVigenteView.as_view()),
    path('tarifario/cuadros/', v.CuadrosPublicadosView.as_view()),
    path('tarifario/cuadros/<int:pk>/', v.CuadroPublicadoView.as_view()),
    path('categorias/', v.CategoriasView.as_view()),
    path('salud/', SaludView.as_view()),
]
```

```python
# backend/apps/tramo/serializers_publica.py
from apps.tramo.models import Cabina, Ciudad, Concesion, Ruta


def _n(d):
    return None if d is None else float(d)


def datos_tramo() -> dict:
    """La forma EXACTA de esquemaTramo."""
    concesion = Concesion.actual()
    rutas = list(Ruta.objects.filter(activa=True).prefetch_related('trazado__ciudad'))
    cabinas = list(Cabina.objects.activas().select_related('ruta'))
    ciudades = list(Ciudad.objects.all())
    provincias = sorted({c.provincia for c in ciudades} | {c.provincia for c in cabinas})
    def cabina(c):
        d = {'slug': c.slug, 'nombre': c.nombre, 'ruta': c.ruta.nombre, 'km': _n(c.km), 'localidad': c.localidad,
             'provincia': c.provincia, 'situacion': c.situacion, 'estado': c.estado, 'mapa': {'x': c.mapa_x, 'y': c.mapa_y},
             'freeFlow': c.free_flow}
        if c.fuente_nombre and c.fuente_url:
            d['fuente'] = {'nombre': c.fuente_nombre, 'url': c.fuente_url}
        return d
    def ruta(r):
        d = {'nombre': r.nombre, 'descripcion': r.descripcion, 'desde': r.desde, 'hasta': r.hasta, 'km': _n(r.km)}
        if r.nota:
            d['nota'] = r.nota
        return d
    return {
        'km': float(concesion.km_total),
        'rutas': [ruta(r) for r in rutas],
        'provincias': provincias,
        'ciudades': [{'slug': c.slug, 'nombre': c.nombre, 'provincia': c.provincia, 'mapa': {'x': c.mapa_x, 'y': c.mapa_y}, 'principal': c.principal} for c in ciudades],
        'cabinas': [cabina(c) for c in cabinas],
        'trazados': [{'ruta': r.nombre, 'ciudades': [t.ciudad.slug for t in r.trazado.all()]} for r in rutas if r.trazado.exists()],
        'avisos': list(concesion.avisos),
    }
```

```python
# backend/apps/tramo/api_publica.py
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
from rest_framework.generics import ListAPIView
from apps.comun.api_publica import ApiPublicaMixin
from apps.tramo.models import Cabina
from apps.tramo.serializers_publica import datos_tramo

class TramoView(ApiPublicaMixin, APIView):
    def get(self, request):
        return Response(datos_tramo())

class CabinaPublicaSerializer(serializers.ModelSerializer):
    ruta = serializers.CharField(source='ruta.nombre')
    class Meta:
        model = Cabina
        fields = ['slug', 'nombre', 'ruta', 'km', 'localidad', 'provincia', 'situacion', 'estado', 'free_flow', 'operativa']
        read_only_fields = fields

class CabinasView(ApiPublicaMixin, ListAPIView):
    serializer_class = CabinaPublicaSerializer
    pagination_class = None
    def get_queryset(self):
        return Cabina.objects.activas().select_related('ruta')
```

```python
# backend/apps/tramo/urls_publica.py
from django.urls import path
from apps.tramo import api_publica as v
urlpatterns = [path('tramo/', v.TramoView.as_view()), path('cabinas/', v.CabinasView.as_view())]
```

- [ ] **Step 3: Test de contrato contra el JSON Schema del front**

```python
# backend/tests/contrato/descargar.py
"""Descarga docs/contrato/*.schema.json del repo público de la landing (o usa CONTRATO_DIR local)."""
import os, pathlib, urllib.request
BASE = 'https://raw.githubusercontent.com/JuliV08/Covicen/main/docs/contrato/'
DESTINO = pathlib.Path(__file__).parent / 'schemas'

def obtener(nombre: str) -> pathlib.Path:
    local = os.environ.get('CONTRATO_DIR')
    if local:
        return pathlib.Path(local) / f'{nombre}.schema.json'
    DESTINO.mkdir(exist_ok=True)
    destino = DESTINO / f'{nombre}.schema.json'
    if not destino.exists():
        urllib.request.urlretrieve(BASE + f'{nombre}.schema.json', destino)  # noqa: S310
    return destino
```

```python
# backend/tests/contrato/test_contrato.py
import json
from datetime import date
import pytest
from jsonschema import Draft202012Validator
from tests.contrato.descargar import obtener
from tests.factories import CabinaFactory, CategoriaFactory, CiudadFactory, ConcesionFactory, CuadroFactory, RutaFactory, TarifaFactory
from apps.tramo.models import TrazadoCiudad

pytestmark = pytest.mark.django_db

def validar(nombre, datos):
    schema = json.loads(obtener(nombre).read_text(encoding='utf-8'))
    errores = sorted(Draft202012Validator(schema).iter_errors(datos), key=lambda e: e.path)
    assert not errores, '\n'.join(f'{list(e.path)}: {e.message}' for e in errores)

def test_tarifario_cumple_el_contrato(cliente):
    cuadro = CuadroFactory(estado='publicado', publicado=True, vigencia_desde=date(2026, 9, 1))
    TarifaFactory(cuadro=cuadro, categoria=CategoriaFactory(slug='cat-1'), monto_sin_iva=None, nota='Sin dato hasta el cuadro homologado.')
    TarifaFactory(cuadro=cuadro, categoria=CategoriaFactory(slug='cat-2'))
    r = cliente.get('/api/v1/tarifario/?fecha=2026-10-10')
    assert r.status_code == 200
    validar('tarifario', r.json())

def test_tramo_cumple_el_contrato(cliente):
    ConcesionFactory(avisos=['Aviso'])
    ruta = RutaFactory(nombre='RN 9')
    c1, c2 = CiudadFactory(slug='rosario', principal=True), CiudadFactory(slug='cordoba')
    TrazadoCiudad.objects.create(ruta=ruta, ciudad=c1, orden=1); TrazadoCiudad.objects.create(ruta=ruta, ciudad=c2, orden=2)
    CabinaFactory(ruta=ruta, slug='leones', fuente_nombre='La Capital', fuente_url='https://www.lacapital.com.ar/x')
    r = cliente.get('/api/v1/tramo/')
    assert r.status_code == 200
    validar('tramo', r.json())
```

El contrato exige `RUTAS = ['RN 9','RN 19','RN 34']` en `esquemaNombreRuta`: por eso el test de tramo crea la ruta con `nombre='RN 9'`.

- [ ] **Step 4: `pytest apps/tarifario/tests/test_api_publica.py tests/contrato -v`** (con `CONTRATO_DIR=/c/Users/Villex/dev/Covicen/docs/contrato` en local) → PASS. Commit: `feat(api): API pública de solo lectura con contrato validado contra los esquemas del front`

### Task 10: API del panel `/api/panel/`: sesión, permisos, CRUDs, acciones, historial, inicio

**Files:**
- Create: `backend/apps/comun/permisos.py`, `backend/apps/comun/historial.py`
- Modify: `backend/apps/comun/excepciones.py` (agrega `manejador`), `backend/apps/cuentas/{serializers,views,urls}.py`, `backend/apps/tramo/{serializers_panel,api_panel,urls_panel}.py`, `backend/apps/tarifario/{serializers_panel,api_panel,urls_panel}.py`, `backend/apps/publicacion/{serializers,views,urls}.py`, tests: `backend/apps/cuentas/tests/test_sesion.py`, `backend/apps/cuentas/tests/test_usuarios.py`, `backend/apps/tarifario/tests/test_api_panel.py`, `backend/apps/tramo/tests/test_api_panel.py`, `backend/apps/publicacion/tests/test_api.py`

**Interfaces:**
- Produces: endpoints de la spec §7. Permiso `PermisoDeModeloEstricto` (GET exige `view_*`). Manejador de excepciones que traduce `ErrorDeNegocio` → 400 `{codigo, detail}` y `Conflicto` → 409. Serializers del panel en snake_case (el panel es nuestro; solo la API pública habla camelCase).

- [ ] **Step 1: Tests de sesión y permisos (los que exige la revisión de seguridad)**

```python
# backend/apps/cuentas/tests/test_sesion.py
import pytest
from tests.factories import UsuarioFactory
pytestmark = pytest.mark.django_db

def login(cliente, email, clave='una-clave-larga-123'):
    cliente.get('/api/panel/csrf/')
    token = cliente.cookies['csrftoken'].value
    return cliente.post('/api/panel/sesion/', {'email': email, 'password': clave}, HTTP_X_CSRFTOKEN=token, format='json')

def test_login_sin_csrf_es_rechazado(cliente):
    u = UsuarioFactory()
    assert cliente.post('/api/panel/sesion/', {'email': u.email, 'password': 'una-clave-larga-123'}, format='json').status_code == 403

def test_login_ok_devuelve_yo_y_permisos(cliente):
    u = UsuarioFactory(grupo='Carga')
    r = login(cliente, u.email)
    assert r.status_code == 200 and r.json()['email'] == u.email and 'tarifario.add_cuadro' in r.json()['permisos']
    assert cliente.cookies['sessionid']['httponly']

def test_mismo_mensaje_para_inexistente_inactivo_y_clave_mala(cliente):
    u = UsuarioFactory(); inactivo = UsuarioFactory(is_active=False)
    r1 = login(cliente, 'nadie@covicen.com.ar'); r2 = login(cliente, u.email, 'mala'); r3 = login(cliente, inactivo.email)
    assert r1.status_code == r2.status_code == r3.status_code == 400
    assert r1.json()['detail'] == r2.json()['detail'] == r3.json()['detail']

def test_bloqueo_tras_cinco_intentos_aunque_falsifiquen_x_forwarded_for(cliente):
    u = UsuarioFactory()
    for i in range(5):
        cliente.get('/api/panel/csrf/')
        cliente.post('/api/panel/sesion/', {'email': u.email, 'password': 'mala'}, format='json',
                     HTTP_X_CSRFTOKEN=cliente.cookies['csrftoken'].value, HTTP_X_FORWARDED_FOR=f'10.0.0.{i}', REMOTE_ADDR='1.2.3.4')
    r = login(cliente, u.email)  # clave correcta, pero la cuenta está bloqueada por una hora
    assert r.status_code == 400 and r.json()['detail'] == 'Email o contraseña incorrectos.'

def test_carga_no_lee_usuarios(cliente):
    u = UsuarioFactory(grupo='Carga'); login(cliente, u.email)
    assert cliente.get('/api/panel/usuarios/').status_code == 403

def test_anonimo_es_401(cliente):
    assert cliente.get('/api/panel/cuadros/').status_code in (401, 403)
```

```python
# backend/apps/cuentas/tests/test_usuarios.py
import pytest
from tests.factories import UsuarioFactory
from apps.cuentas.tests.test_sesion import login
pytestmark = pytest.mark.django_db

def test_administracion_no_puede_hacerse_superusuario_por_mass_assignment(cliente):
    admin = UsuarioFactory(grupo='Administración'); login(cliente, admin.email)
    r = cliente.patch(f'/api/panel/usuarios/{admin.id}/', {'is_superuser': True, 'groups': ['Administración']}, format='json',
                      HTTP_X_CSRFTOKEN=cliente.cookies['csrftoken'].value)
    admin.refresh_from_db()
    assert r.status_code == 200 and admin.is_superuser is False

def test_grupos_solo_los_tres(cliente):
    admin = UsuarioFactory(grupo='Administración'); login(cliente, admin.email)
    r = cliente.post('/api/panel/usuarios/', {'email': 'nueva@covicen.com.ar', 'first_name': 'N', 'last_name': 'A', 'groups': ['Superadmin']},
                     format='json', HTTP_X_CSRFTOKEN=cliente.cookies['csrftoken'].value)
    assert r.status_code == 400

def test_restablecer_devuelve_clave_temporal_una_vez_y_obliga_a_cambiarla(cliente):
    admin = UsuarioFactory(grupo='Administración'); otro = UsuarioFactory(); login(cliente, admin.email)
    r = cliente.post(f'/api/panel/usuarios/{otro.id}/restablecer-contrasena/', format='json', HTTP_X_CSRFTOKEN=cliente.cookies['csrftoken'].value)
    otro.refresh_from_db()
    assert r.status_code == 200 and len(r.json()['contrasena_temporal']) >= 16 and otro.debe_cambiar_contrasena

def test_historial_de_usuario_no_trae_password(cliente):
    admin = UsuarioFactory(grupo='Administración'); login(cliente, admin.email)
    r = cliente.get(f'/api/panel/historial/?modelo=cuentas.usuario&id={admin.id}')
    assert r.status_code == 200 and 'password' not in r.content.decode()

def test_historial_de_modelo_fuera_de_la_lista_blanca_es_400(cliente):
    admin = UsuarioFactory(grupo='Administración'); login(cliente, admin.email)
    assert cliente.get('/api/panel/historial/?modelo=auth.permission&id=1').status_code == 400
```

```python
# backend/apps/tarifario/tests/test_api_panel.py
from datetime import date
import pytest
from apps.cuentas.tests.test_sesion import login
from tests.factories import CabinaFactory, CategoriaFactory, CuadroFactory, TarifaFactory, UsuarioFactory
pytestmark = pytest.mark.django_db

def entrar(cliente, grupo):
    u = UsuarioFactory(grupo=grupo); login(cliente, u.email)
    return u, {'HTTP_X_CSRFTOKEN': cliente.cookies['csrftoken'].value}

def test_patch_de_estado_se_ignora(cliente):
    _, h = entrar(cliente, 'Carga'); cuadro = CuadroFactory()
    r = cliente.patch(f'/api/panel/cuadros/{cuadro.id}/', {'estado': 'publicado', 'nombre': 'Nuevo'}, format='json', **h)
    cuadro.refresh_from_db()
    assert r.status_code == 200 and cuadro.estado == 'borrador' and cuadro.nombre == 'Nuevo'

def test_carga_no_publica(cliente):
    _, h = entrar(cliente, 'Carga'); cuadro = CuadroFactory(estado='en_revision')
    assert cliente.post(f'/api/panel/cuadros/{cuadro.id}/publicar/', format='json', **h).status_code == 403

def test_publicacion_publica_y_registra(cliente):
    _, h = entrar(cliente, 'Publicación')
    cuadro = CuadroFactory(estado='en_revision', vigencia_desde=date(2026, 11, 1), fuente_nombre='R', fuente_url='https://x.gob.ar', vigencia_descripcion='V')
    TarifaFactory(cuadro=cuadro, categoria=CategoriaFactory())
    r = cliente.post(f'/api/panel/cuadros/{cuadro.id}/publicar/', format='json', **h)
    assert r.status_code == 200 and r.json()['estado'] == 'publicado' and r.json()['publicacion']['resultado_aviso'] == 'omitido'

def test_publicar_incompleto_devuelve_400_con_codigo(cliente):
    _, h = entrar(cliente, 'Publicación'); cuadro = CuadroFactory(estado='en_revision', fuente_nombre='')
    r = cliente.post(f'/api/panel/cuadros/{cuadro.id}/publicar/', format='json', **h)
    assert r.status_code == 400 and r.json()['codigo'] == 'sin_fuente'

def test_un_publicado_rechaza_tarifas_y_patch_con_409(cliente):
    _, h = entrar(cliente, 'Publicación'); cuadro = CuadroFactory(estado='publicado', publicado=True)
    assert cliente.put(f'/api/panel/cuadros/{cuadro.id}/tarifas/', {'modificado_en': cuadro.modificado_en.isoformat(), 'filas': []}, format='json', **h).status_code == 409
    assert cliente.patch(f'/api/panel/cuadros/{cuadro.id}/', {'nombre': 'x'}, format='json', **h).status_code == 409
    assert cliente.patch(f'/api/panel/cuadros/{cuadro.id}/', {'notas_internas': 'ok'}, format='json', **h).status_code == 200

def test_put_tarifas_con_cuadro_viejo_es_409(cliente):
    _, h = entrar(cliente, 'Carga'); cuadro = CuadroFactory(); cat = CategoriaFactory()
    cuerpo = {'modificado_en': '2020-01-01T00:00:00Z', 'filas': [{'categoria': cat.slug, 'cabina': None, 'monto_sin_iva': '1399.00', 'nota': ''}]}
    assert cliente.put(f'/api/panel/cuadros/{cuadro.id}/tarifas/', cuerpo, format='json', **h).status_code == 409

def test_put_tarifas_ok_devuelve_la_grilla_con_iva(cliente):
    _, h = entrar(cliente, 'Carga'); cuadro = CuadroFactory(); cat = CategoriaFactory(); cab = CabinaFactory()
    cuerpo = {'modificado_en': cuadro.modificado_en.isoformat(),
              'filas': [{'categoria': cat.slug, 'cabina': None, 'monto_sin_iva': '1399.00', 'nota': ''},
                        {'categoria': cat.slug, 'cabina': cab.slug, 'monto_sin_iva': '999.00', 'nota': 'Promo'}]}
    r = cliente.put(f'/api/panel/cuadros/{cuadro.id}/tarifas/', cuerpo, format='json', **h)
    assert r.status_code == 200 and r.json()['tarifas'][0]['monto_con_iva'] == '1693' and len(r.json()['tarifas']) == 2

def test_inicio_resume_estado(cliente):
    entrar(cliente, 'Carga'); CuadroFactory(estado='publicado', publicado=True, vigencia_desde=date(2026, 9, 1))
    d = cliente.get('/api/panel/inicio/').json()
    assert d['vigente']['nombre'] and d['proximo'] is None and 'cabinas' in d and 'publicaciones' in d
```

- [ ] **Step 2: Permisos, excepciones, historial**

```python
# backend/apps/comun/permisos.py
from rest_framework.permissions import BasePermission, DjangoModelPermissions

class PermisoDeModeloEstricto(DjangoModelPermissions):
    """Como DjangoModelPermissions, pero GET/HEAD/OPTIONS también exigen view_*."""
    perms_map = {**DjangoModelPermissions.perms_map,
                 'GET': ['%(app_label)s.view_%(model_name)s'], 'HEAD': ['%(app_label)s.view_%(model_name)s'],
                 'OPTIONS': ['%(app_label)s.view_%(model_name)s']}

def permiso(codename: str):
    class _Permiso(BasePermission):
        message = 'No tenés permiso para esta acción.'
        def has_permission(self, request, view):
            return request.user.is_authenticated and request.user.has_perm(codename)
    return _Permiso
```

```python
# backend/apps/comun/excepciones.py  (agregar debajo de las clases de la Tarea 6)
from django.db.models import ProtectedError
from rest_framework.response import Response
from rest_framework.views import exception_handler

def manejador(exc, contexto):
    if isinstance(exc, Conflicto):
        return Response({'codigo': exc.codigo, 'detail': exc.mensaje}, status=409)
    if isinstance(exc, ErrorDeNegocio):
        return Response({'codigo': exc.codigo, 'detail': exc.mensaje}, status=400)
    if isinstance(exc, ProtectedError):
        return Response({'codigo': 'en_uso', 'detail': 'No se puede borrar: tiene datos asociados. Desactivalo en vez de borrarlo.'}, status=409)
    return exception_handler(exc, contexto)
```

```python
# backend/apps/comun/historial.py
from django.apps import apps
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

LISTA_BLANCA = {'cuentas.usuario', 'tramo.ruta', 'tramo.ciudad', 'tramo.cabina', 'tramo.concesion',
                'tarifario.categoriavehiculo', 'tarifario.cuadro', 'tarifario.tarifa'}

class HistorialView(APIView):
    def get(self, request):
        modelo, pk = request.query_params.get('modelo', ''), request.query_params.get('id')
        if modelo not in LISTA_BLANCA or not (pk or '').isdigit():
            raise serializers.ValidationError('Modelo o id inválidos.')
        app, nombre = modelo.split('.')
        if not request.user.has_perm(f'{app}.view_{nombre}'):
            return Response({'detail': 'Sin permiso.'}, status=403)
        Modelo = apps.get_model(app, nombre)
        objeto = Modelo.objects.filter(pk=pk).first()
        if objeto is None:
            return Response({'detail': 'No encontrado.'}, status=404)
        filas = []
        for h in objeto.history.select_related('history_user').all()[:200]:
            anterior = h.prev_record
            cambios = [{'campo': c.field, 'antes': str(c.old), 'despues': str(c.new)} for c in h.diff_against(anterior).changes] if anterior else []
            filas.append({'fecha': h.history_date, 'usuario': getattr(h.history_user, 'email', None), 'tipo': h.get_history_type_display(), 'cambios': cambios})
        return Response(filas)
```

- [ ] **Step 3: Sesión y usuarios**

```python
# backend/apps/cuentas/serializers.py
import secrets
from django.contrib.auth.models import Group
from rest_framework import serializers
from apps.cuentas.models import Usuario

GRUPOS = ['Carga', 'Publicación', 'Administración']

class YoSerializer(serializers.ModelSerializer):
    grupos = serializers.SerializerMethodField()
    permisos = serializers.SerializerMethodField()
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'first_name', 'last_name', 'grupos', 'permisos', 'debe_cambiar_contrasena']
        read_only_fields = fields
    def get_grupos(self, u): return list(u.groups.values_list('name', flat=True))
    def get_permisos(self, u): return sorted(u.get_all_permissions())

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(trim_whitespace=False)

class UsuarioSerializer(serializers.ModelSerializer):
    groups = serializers.SlugRelatedField(slug_field='name', queryset=Group.objects.filter(name__in=GRUPOS), many=True)
    class Meta:
        model = Usuario
        fields = ['id', 'email', 'first_name', 'last_name', 'is_active', 'groups', 'debe_cambiar_contrasena', 'date_joined', 'last_login']
        read_only_fields = ['id', 'debe_cambiar_contrasena', 'date_joined', 'last_login']
    def create(self, datos):
        grupos = datos.pop('groups')
        temporal = secrets.token_urlsafe(16)
        usuario = Usuario.objects.create_user(password=temporal, debe_cambiar_contrasena=True, **datos)
        usuario.groups.set(grupos)
        usuario.contrasena_temporal = temporal  # solo para la respuesta de alta
        return usuario

class CambioContrasenaSerializer(serializers.Serializer):
    actual = serializers.CharField(trim_whitespace=False)
    nueva = serializers.CharField(trim_whitespace=False)
```

```python
# backend/apps/cuentas/views.py
import secrets
from django.contrib.auth import authenticate, login, logout, password_validation
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.comun.permisos import PermisoDeModeloEstricto
from apps.cuentas.models import Usuario
from apps.cuentas.serializers import CambioContrasenaSerializer, LoginSerializer, UsuarioSerializer, YoSerializer

MENSAJE_LOGIN = 'Email o contraseña incorrectos.'

@method_decorator(ensure_csrf_cookie, name='get')
class CsrfView(APIView):
    authentication_classes, permission_classes = [], [AllowAny]
    def get(self, request):
        return Response({'ok': True})

@method_decorator(csrf_protect, name='post')
class SesionView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        if not request.user.is_authenticated:
            return Response({'detail': 'Sin sesión.'}, status=401)
        return Response(YoSerializer(request.user).data)
    def post(self, request):
        s = LoginSerializer(data=request.data); s.is_valid(raise_exception=True)
        usuario = authenticate(request, username=s.validated_data['email'].lower(), password=s.validated_data['password'])
        if usuario is None:  # inexistente, inactivo, clave mala o bloqueado por axes: un solo mensaje
            return Response({'detail': MENSAJE_LOGIN}, status=400)
        login(request, usuario)
        return Response(YoSerializer(usuario).data)
    def delete(self, request):
        logout(request)
        return Response(status=204)

class ContrasenaView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        s = CambioContrasenaSerializer(data=request.data); s.is_valid(raise_exception=True)
        if not request.user.check_password(s.validated_data['actual']):
            return Response({'detail': 'La contraseña actual no es correcta.'}, status=400)
        password_validation.validate_password(s.validated_data['nueva'], request.user)
        request.user.set_password(s.validated_data['nueva']); request.user.debe_cambiar_contrasena = False; request.user.save()
        login(request, request.user)  # renueva la sesión
        return Response({'ok': True})

class UsuarioViewSet(viewsets.ModelViewSet):
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated, PermisoDeModeloEstricto]
    http_method_names = ['get', 'post', 'patch', 'head', 'options']
    def get_queryset(self):
        return Usuario.objects.filter(is_superuser=False).prefetch_related('groups').order_by('email')
    def create(self, request, *args, **kwargs):
        r = super().create(request, *args, **kwargs)
        r.data['contrasena_temporal'] = self.serializer_instance_temporal
        return r
    def perform_create(self, serializer):
        usuario = serializer.save()
        self.serializer_instance_temporal = usuario.contrasena_temporal
    @action(detail=True, methods=['post'], url_path='restablecer-contrasena')
    def restablecer(self, request, pk=None):
        usuario = self.get_object()
        temporal = secrets.token_urlsafe(16)
        usuario.set_password(temporal); usuario.debe_cambiar_contrasena = True; usuario.save()
        return Response({'contrasena_temporal': temporal})
```

`authenticate()` con `AxesStandaloneBackend` devuelve `None` cuando la cuenta está bloqueada (con `AXES_LOCKOUT_CALLABLE` sin definir, axes lanza `AxesBackendPermissionDenied`, que `authenticate` traduce a `None`). Verificarlo en el test de bloqueo; si axes levanta `PermissionDenied` en `authenticate`, envolver con `try/except PermissionDenied` y devolver el mismo mensaje.

```python
# backend/apps/cuentas/urls.py
from django.urls import path
from rest_framework.routers import DefaultRouter
from apps.comun.historial import HistorialView
from apps.cuentas import views
router = DefaultRouter(); router.register('usuarios', views.UsuarioViewSet, basename='usuario')
urlpatterns = [
    path('csrf/', views.CsrfView.as_view()), path('sesion/', views.SesionView.as_view()),
    path('sesion/contrasena/', views.ContrasenaView.as_view()), path('historial/', HistorialView.as_view()),
] + router.urls
```

- [ ] **Step 4: Catálogo y categorías (CRUD mecánico, `bk-bro`)**

Un `ModelViewSet` por modelo (`RutaViewSet`, `CiudadViewSet`, `CabinaViewSet`, `TrazadoViewSet`, `ConcesionViewSet` con `http_method_names=['get','patch']`, `CategoriaViewSet`), todos con `permission_classes = [IsAuthenticated, PermisoDeModeloEstricto]`, `get_queryset()` explícito (`Cabina.objects.select_related('ruta').order_by('orden')`), `filterset_fields`/`search_fields` (`SearchFilter` de DRF sobre `nombre`, `slug`, `localidad`), serializers con campos explícitos y `read_only_fields=['id']`. Borrado: `Ruta` y `CategoriaVehiculo` no se borran si tienen referencias (`ProtectedError` → 409 `{"codigo":"en_uso"}` en el manejador de excepciones); `Cabina` se desactiva con `PATCH {activa:false}`, pero `perform_update` lanza `Conflicto('cabina_en_uso', ...)` si se la quiere desactivar teniendo tarifas en un cuadro publicado, y el `destroy` devuelve 409 si tiene cualquier tarifa (spec §5.6). Cambiar el `slug` de cabina, ciudad o categoría devuelve además `advertencia: 'La landing usa este slug como identificador'` en la respuesta, que el panel muestra.

Tests (`tramo/tests/test_api_panel.py`): Carga crea y edita una cabina; `fuente_url` con `javascript:` → 400; borrar una categoría con tarifas → 409; anónimo → 401/403.

- [ ] **Step 5: Cuadros, tarifas, acciones, publicaciones e inicio**

```python
# backend/apps/tarifario/serializers_panel.py
from rest_framework import serializers
from apps.tarifario.models import Cuadro, Tarifa

class TarifaSerializer(serializers.ModelSerializer):
    categoria = serializers.SlugRelatedField(slug_field='slug', read_only=True)
    cabina = serializers.SlugRelatedField(slug_field='slug', read_only=True)
    monto_con_iva = serializers.SerializerMethodField()
    class Meta:
        model = Tarifa
        fields = ['id', 'categoria', 'cabina', 'monto_sin_iva', 'monto_con_iva', 'nota']
        read_only_fields = fields
    def get_monto_con_iva(self, t):
        v = t.monto_con_iva
        return None if v is None else str(v)

class CuadroSerializer(serializers.ModelSerializer):
    tarifas = TarifaSerializer(many=True, read_only=True)
    publicado_por = serializers.SlugRelatedField(slug_field='email', read_only=True)
    creado_por = serializers.SlugRelatedField(slug_field='email', read_only=True)
    class Meta:
        model = Cuadro
        fields = ['id', 'nombre', 'vigencia_desde', 'vigencia_hasta', 'vigencia_descripcion', 'origen', 'alicuota_iva', 'redondeo',
                  'fuente_nombre', 'fuente_url', 'resolucion', 'avisos', 'estado', 'notas_internas', 'creado_por', 'creado_en',
                  'modificado_en', 'publicado_por', 'publicado_en', 'archivado_en', 'tarifas']
        read_only_fields = ['id', 'estado', 'vigencia_hasta', 'resolucion', 'creado_por', 'creado_en', 'modificado_en',
                            'publicado_por', 'publicado_en', 'archivado_en', 'tarifas']
    def validate_fuente_url(self, v):
        if v and not v.startswith(('http://', 'https://')):
            raise serializers.ValidationError('El link tiene que empezar con http.')
        return v
    def validate_avisos(self, v):
        if len(v) > 5 or any(not isinstance(a, str) or len(a) > 300 for a in v):
            raise serializers.ValidationError('Hasta 5 avisos de 300 caracteres.')
        return v

class FilaGrillaSerializer(serializers.Serializer):
    categoria = serializers.SlugField(max_length=40)
    cabina = serializers.SlugField(max_length=60, allow_null=True, required=False)
    monto_sin_iva = serializers.DecimalField(max_digits=12, decimal_places=2, allow_null=True, min_value=0.01)
    nota = serializers.CharField(max_length=200, allow_blank=True, required=False)

class GrillaSerializer(serializers.Serializer):
    modificado_en = serializers.DateTimeField()
    filas = FilaGrillaSerializer(many=True)
```

```python
# backend/apps/tarifario/api_panel.py
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.comun.permisos import PermisoDeModeloEstricto, permiso
from apps.publicacion import servicios as publicacion
from apps.publicacion.serializers import PublicacionSerializer
from apps.tarifario import servicios
from apps.comun.excepciones import Conflicto
from apps.tarifario.models import Cuadro
from apps.tarifario.serializers_panel import CuadroSerializer, GrillaSerializer
from apps.tramo.models import Cabina


class CuadroViewSet(viewsets.ModelViewSet):
    serializer_class = CuadroSerializer
    permission_classes = [IsAuthenticated, PermisoDeModeloEstricto]
    filterset_fields = ['estado', 'origen']
    http_method_names = ['get', 'post', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Cuadro.objects.select_related('creado_por', 'publicado_por').prefetch_related('tarifas__categoria', 'tarifas__cabina')

    def get_permissions(self):
        extra = {'publicar': 'tarifario.publicar_cuadro', 'archivar': 'tarifario.archivar_cuadro'}
        if self.action in extra:
            return [IsAuthenticated(), permiso(extra[self.action])()]
        return super().get_permissions()

    def perform_create(self, serializer):
        serializer.save(creado_por=self.request.user)

    def perform_update(self, serializer):
        cuadro = serializer.instance
        cambios = set(serializer.validated_data) - {'notas_internas'}
        if not cuadro.editable and cambios:
            raise Conflicto('estado_invalido', 'Un cuadro publicado o archivado no se edita: duplicalo.')
        serializer.save()

    def perform_destroy(self, cuadro):
        if not cuadro.editable:
            raise Conflicto('estado_invalido', 'Un cuadro publicado o archivado no se borra.')
        cuadro.delete()

    def _accion(self, request, fn, **kw):
        cuadro = fn(self.get_object(), request.user, **kw)
        return Response(self.get_serializer(cuadro).data)

    @action(detail=True, methods=['post'], url_path='enviar-a-revision')
    def enviar_a_revision(self, request, pk=None): return self._accion(request, servicios.enviar_a_revision)

    @action(detail=True, methods=['post'], url_path='volver-a-borrador')
    def volver_a_borrador(self, request, pk=None): return self._accion(request, servicios.volver_a_borrador)

    @action(detail=True, methods=['post'])
    def publicar(self, request, pk=None):
        cuadro = servicios.publicar_cuadro(self.get_object(), request.user)
        pub = publicacion.registrar_y_avisar(cuadro, request.user, 'publicar')
        datos = self.get_serializer(cuadro).data; datos['publicacion'] = PublicacionSerializer(pub).data
        return Response(datos)

    @action(detail=True, methods=['post'])
    def archivar(self, request, pk=None):
        cuadro = servicios.archivar_cuadro(self.get_object(), request.user)
        pub = publicacion.registrar_y_avisar(cuadro, request.user, 'archivar')
        datos = self.get_serializer(cuadro).data; datos['publicacion'] = PublicacionSerializer(pub).data
        return Response(datos)

    @action(detail=True, methods=['post'])
    def duplicar(self, request, pk=None):
        copia = servicios.duplicar_cuadro(self.get_object(), request.user)
        return Response(self.get_serializer(copia).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['put'])
    def tarifas(self, request, pk=None):
        s = GrillaSerializer(data=request.data); s.is_valid(raise_exception=True)
        filas = [{**f, 'cabina': f.get('cabina') or None} for f in s.validated_data['filas']]
        servicios.reemplazar_tarifas(self.get_object(), filas, request.user, s.validated_data['modificado_en'])
        return Response(self.get_serializer(self.get_object()).data)

    @action(detail=True, methods=['post', 'delete'], parser_classes=[MultiPartParser])
    def resolucion(self, request, pk=None):
        cuadro = self.get_object()
        if not cuadro.editable:
            raise Conflicto('estado_invalido', 'Un cuadro publicado no cambia su resolución.')
        if request.method == 'DELETE':
            cuadro.resolucion.delete(save=True)
        else:
            cuadro.resolucion = request.FILES['archivo']; cuadro.full_clean(exclude=None); cuadro.save()
        return Response(self.get_serializer(cuadro).data)


class InicioView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        hoy = timezone.localdate()
        vigente, proximo = Cuadro.objects.vigente(hoy), Cuadro.objects.proximo(hoy)
        resumen = lambda c: None if c is None else {'id': c.id, 'nombre': c.nombre, 'vigencia_desde': c.vigencia_desde, 'vigencia_hasta': c.vigencia_hasta}  # noqa: E731
        from apps.publicacion.models import Publicacion
        return Response({
            'hoy': hoy, 'vigente': resumen(vigente), 'proximo': resumen(proximo),
            'pendientes': {'borradores': Cuadro.objects.filter(estado='borrador').count(), 'en_revision': Cuadro.objects.filter(estado='en_revision').count()},
            'cabinas': {'activas': Cabina.objects.activas().count(), 'operativas': Cabina.objects.activas().filter(operativa=True).count()},
            'publicaciones': PublicacionSerializer(Publicacion.objects.select_related('usuario')[:5], many=True).data,
        })
```

`apps/publicacion/serializers.py`: `PublicacionSerializer` (`id, fecha, accion, resultado_aviso, detalle, avisado_en, usuario (email), objeto (label + id)`, todo read-only). `apps/publicacion/views.py`: `PublicacionViewSet` (`ReadOnlyModelViewSet` + `@action reintentar` con `permiso('publicacion.add_publicacion')` y `throttle_classes=[ReintentoThrottle]`). `urls_panel.py` de `tarifario`: router con `cuadros` + `path('inicio/', InicioView)`; `urls_panel.py` de `tramo`: router con `rutas`, `ciudades`, `trazados`, `cabinas`, `concesion`, `categorias` (categorías vive en `tarifario` pero se registra acá para un solo router: mejor registrarlo en el router de `tarifario`; decidir uno y no duplicar).

- [ ] **Step 6: `pytest -v`** → PASS (toda la suite). `ruff check` limpio. Commit: `feat(panel-api): sesión con CSRF y bloqueo, permisos estrictos, cuadros con acciones y grilla, historial, usuarios, inicio`

### Task 11: Archivos: validación real del PDF

**Files:**
- Modify: `backend/apps/comun/archivos.py`
- Create: `backend/apps/comun/tests/test_archivos.py`

- [ ] **Step 1: Tests**

```python
# backend/apps/comun/tests/test_archivos.py
import pytest
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.comun.archivos import validar_pdf, ruta_resolucion

def test_acepta_un_pdf_real():
    validar_pdf(SimpleUploadedFile('res.pdf', b'%PDF-1.7\n%...', content_type='application/pdf'))

@pytest.mark.parametrize('nombre,contenido', [('res.php', b'%PDF-1.7'), ('res.pdf', b'<?php echo 1; ?>'), ('res.pdf.exe', b'%PDF-1.7')])
def test_rechaza_extension_o_firma_falsa(nombre, contenido):
    with pytest.raises(ValidationError):
        validar_pdf(SimpleUploadedFile(nombre, contenido))

def test_rechaza_mas_de_10_mb():
    with pytest.raises(ValidationError):
        validar_pdf(SimpleUploadedFile('res.pdf', b'%PDF-1.7' + b'0' * (10 * 1024 * 1024 + 1)))

def test_el_nombre_lo_pone_el_servidor():
    assert ruta_resolucion(None, '../../etc/passwd.pdf').startswith('resoluciones/') and ruta_resolucion(None, 'a.pdf').endswith('.pdf')
```

- [ ] **Step 2: Implementación**

```python
# backend/apps/comun/archivos.py
import uuid
from django.core.exceptions import ValidationError

MAX_PDF = 10 * 1024 * 1024

def validar_pdf(archivo):
    nombre = (archivo.name or '').lower()
    if not nombre.endswith('.pdf') or nombre.count('.') != 1:
        raise ValidationError('Solo se aceptan archivos .pdf.')
    if archivo.size > MAX_PDF:
        raise ValidationError('El PDF no puede superar los 10 MB.')
    archivo.seek(0)
    if archivo.read(5) != b'%PDF-':
        raise ValidationError('El archivo no es un PDF válido.')
    archivo.seek(0)

def ruta_resolucion(instancia, nombre_original):
    return f'resoluciones/{uuid.uuid4()}.pdf'
```

- [ ] **Step 3: `pytest apps/comun -v` → PASS. Commit: `feat(archivos): validación real del PDF y nombre generado por el servidor`**

### Task 12: `cargar_demo` idempotente y con guarda de entorno

**Files:**
- Create: `backend/apps/tarifario/management/commands/cargar_demo.py`, `backend/apps/tarifario/fixtures/demo/tramo.json` (copia literal de `Covicen/src/content/tramo.json`), `backend/apps/tarifario/fixtures/demo/categorias.json` (las seis de `tarifario.json`), `backend/apps/tarifario/tests/test_cargar_demo.py`

- [ ] **Step 1: Tests**

```python
# backend/apps/tarifario/tests/test_cargar_demo.py
import pytest
from django.core.management import CommandError, call_command
from django.test import override_settings
from apps.tarifario.models import Cuadro
from apps.tramo.models import Cabina
from apps.cuentas.models import Usuario
pytestmark = pytest.mark.django_db

def test_carga_catalogo_categorias_y_un_cuadro_publicado_vigente_hoy():
    call_command('cargar_demo', email='demo@covicen.com.ar', password='una-clave-larga-123')
    assert Cabina.objects.count() >= 6 and Cuadro.objects.vigente() is not None
    assert Usuario.objects.get(email='demo@covicen.com.ar').groups.filter(name='Administración').exists()

def test_es_idempotente():
    for _ in range(2):
        call_command('cargar_demo', email='demo@covicen.com.ar', password='una-clave-larga-123')
    assert Cuadro.objects.count() == 1 and Usuario.objects.count() == 1

@override_settings(ENTORNO='prod')
def test_se_niega_en_prod_sin_bandera():
    with pytest.raises(CommandError):
        call_command('cargar_demo', email='x@x.com', password='una-clave-larga-123')
```

- [ ] **Step 2: Comando**

```python
# backend/apps/tarifario/management/commands/cargar_demo.py
import json
from decimal import Decimal
from pathlib import Path
from django.conf import settings
from django.contrib.auth.models import Group
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone
from apps.cuentas.models import Usuario
from apps.tarifario.models import CategoriaVehiculo, Cuadro, Tarifa
from apps.tramo.models import Cabina, Ciudad, Concesion, Ruta, TrazadoCiudad

FIXTURES = Path(__file__).resolve().parents[2] / 'fixtures' / 'demo'

class Command(BaseCommand):
    help = 'Carga el catálogo del Tramo Centro, las categorías y el cuadro de la oferta publicado. Idempotente. Solo en local.'

    def add_arguments(self, parser):
        parser.add_argument('--email', required=True); parser.add_argument('--password', required=True)
        parser.add_argument('--si-estoy-seguro', action='store_true')

    @transaction.atomic
    def handle(self, *a, **o):
        if (settings.ENTORNO == 'prod' or not settings.DEBUG) and not o['si_estoy_seguro']:
            raise CommandError('cargar_demo es para local. En producción pasá --si-estoy-seguro si de verdad lo querés.')
        tramo = json.loads((FIXTURES / 'tramo.json').read_text(encoding='utf-8'))
        Concesion.objects.update_or_create(singleton=True, defaults={'nombre': 'Tramo Centro', 'km_total': Decimal(str(tramo['km'])), 'avisos': tramo['avisos']})
        rutas = {}
        for i, r in enumerate(tramo['rutas']):
            rutas[r['nombre']], _ = Ruta.objects.update_or_create(nombre=r['nombre'], defaults={'descripcion': r['descripcion'], 'desde': r['desde'], 'hasta': r['hasta'], 'km': r.get('km'), 'nota': r.get('nota', ''), 'orden': i})
        ciudades = {}
        for c in tramo['ciudades']:
            ciudades[c['slug']], _ = Ciudad.objects.update_or_create(slug=c['slug'], defaults={'nombre': c['nombre'], 'provincia': c['provincia'], 'mapa_x': c['mapa']['x'], 'mapa_y': c['mapa']['y'], 'principal': c.get('principal', False)})
        for t in tramo['trazados']:
            TrazadoCiudad.objects.filter(ruta=rutas[t['ruta']]).delete()
            for i, slug in enumerate(t['ciudades'], start=1):
                TrazadoCiudad.objects.create(ruta=rutas[t['ruta']], ciudad=ciudades[slug], orden=i)
        for i, c in enumerate(tramo['cabinas']):
            Cabina.objects.update_or_create(slug=c['slug'], defaults={
                'nombre': c['nombre'], 'ruta': rutas[c['ruta']], 'km': c.get('km'), 'localidad': c['localidad'], 'provincia': c['provincia'],
                'situacion': c['situacion'], 'estado': c['estado'], 'mapa_x': c['mapa']['x'], 'mapa_y': c['mapa']['y'],
                'fuente_nombre': c.get('fuente', {}).get('nombre', ''), 'fuente_url': c.get('fuente', {}).get('url', ''), 'orden': i})
        categorias = json.loads((FIXTURES / 'categorias.json').read_text(encoding='utf-8'))
        for i, c in enumerate(categorias):
            CategoriaVehiculo.objects.update_or_create(slug=c['categoria'], defaults={'nombre': c['nombre'], 'descripcion': c['descripcion'], 'orden': i})
        if not Usuario.objects.exists():
            usuario = Usuario.objects.create_user(email=o['email'], password=o['password'], first_name='Demo', last_name='Covicen')
            usuario.groups.add(Group.objects.get(name='Administración'))
        usuario = Usuario.objects.order_by('id').first()
        if not Cuadro.objects.publicados().exists():
            cuadro = Cuadro.objects.create(
                nombre='Oferta 2026', vigencia_desde=timezone.localdate(), origen='oferta', creado_por=usuario,
                vigencia_descripcion='Tarifa ofertada en la adjudicación. El cobro pleno empieza cuando Vialidad Nacional habilite la transitabilidad óptima.',
                fuente_nombre='Resolución 1379/2026 — Boletín Oficial', fuente_url='https://www.boletinoficial.gob.ar/detalleAviso/primera/346271/20260824',
                avisos=['Los valores sin dato se publican cuando exista el cuadro homologado.'], estado='publicado', publicado_por=usuario, publicado_en=timezone.now())
            for c in categorias:
                Tarifa.objects.create(cuadro=cuadro, categoria=CategoriaVehiculo.objects.get(slug=c['categoria']),
                                      monto_sin_iva=Decimal(str(c['montoSinIva'])) if c.get('montoSinIva') else None, nota=c.get('nota', ''))
        self.stdout.write(self.style.SUCCESS('Demo cargada.'))
```

- [ ] **Step 3: `pytest apps/tarifario/tests/test_cargar_demo.py -v` → PASS; en Docker: `docker compose -f infra/compose.yaml exec backend uv run python manage.py cargar_demo --email demo@covicen.com.ar --password <clave>` y `curl localhost:8000/api/v1/tarifario/` devuelve el cuadro. Commit: `feat(demo): cargar_demo idempotente con el catálogo de la landing`**

### Task 13: Compuerta local (`lefthook`) y CI del backend (`ops-bro`)

**Files:**
- Create: `lefthook.yml` (raíz del repo), `.github/workflows/ci.yml` (job `backend`; los jobs `panel` y `e2e` se agregan en Tareas 21 y 24)

- [ ] **Step 0: Compuerta local**

```yaml
# lefthook.yml  (instalar con `pnpm add -g lefthook` o `pip install lefthook`; `lefthook install` en el repo)
pre-push:
  parallel: false
  commands:
    backend:
      run: docker compose -f infra/compose.yaml exec -T backend sh -c "uv run ruff check . && uv run ruff format --check . && uv run python manage.py makemigrations --check --dry-run && uv run pytest -q"
    panel:
      glob: "panel/**"
      run: pnpm --dir panel verificar
```

Verificación: `git push` con un test roto → el push no sale; con todo verde → sale.

- [ ] **Step 1: Workflow**

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
permissions: { contents: read }
jobs:
  backend:
    runs-on: ubuntu-latest
    services:
      db:
        image: postgres:17
        env: { POSTGRES_USER: covicen_app, POSTGRES_PASSWORD: ci, POSTGRES_DB: covicen }
        ports: ["5432:5432"]
        options: --health-cmd "pg_isready -U covicen_app" --health-interval 5s --health-retries 10
    env:
      DATABASE_URL: postgres://covicen_app:ci@localhost:5432/covicen
      DJANGO_SECRET_KEY: solo-para-ci
      DJANGO_SETTINGS_MODULE: config.settings.test
    defaults: { run: { working-directory: backend } }  # los `uses` no lo respetan: gitleaks corre sobre el repo entero
    steps:
      - uses: actions/checkout@<SHA de v5>
        with: { fetch-depth: 0 }   # gitleaks revisa el historial completo
      - uses: astral-sh/setup-uv@<SHA de v6>
        with: { version: "0.9.x" }
      - run: uv sync --frozen
      - run: uv run ruff check . && uv run ruff format --check .
      - run: uv run python manage.py makemigrations --check --dry-run
      - run: uv run pytest
      - run: uv run pip-audit
      - uses: gitleaks/gitleaks-action@<SHA de v2>
        with: { args: --no-banner }
        env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}" }
```

Los `<SHA de vN>` se resuelven al escribir el archivo con `gh api repos/<owner>/<repo>/git/ref/tags/vN --jq .object.sha` y se anotan con un comentario `# vN`. Regla: nunca `@vN` suelto.

- [ ] **Step 2: Push a una rama, abrir PR de prueba, ver el job verde. Commit: `ci: backend con lint, migraciones, tests, auditoría y gitleaks`**

**Cierre de la Fase B:** `rev-bro` revisa Tareas 9 a 12 contra §6, §7, §11 (incluida la tabla 11.1) con la suite en verde. `sec-bro` hace una pasada corta sobre `cuentas/views.py`, `comun/permisos.py`, `comun/historial.py` y `tarifario/api_panel.py` (condición (c) del veredicto, primera mitad).

---

## Fase C — Panel React (`ux-bro` para lo mecánico; el tech lead define tokens, cliente HTTP y la grilla)

### Task 14: Scaffold del panel, tokens de Covicen, primitivas y guards de V-Shop

**Files:**
- Create: `panel/package.json`, `panel/vite.config.ts`, `panel/tsconfig.json`, `panel/tailwind.config.js`, `panel/postcss.config.js`, `panel/index.html`, `panel/src/main.tsx`, `panel/src/index.css`, `panel/src/vite-env.d.ts`, `panel/src/test-setup.ts`
- Copy (de `C:\Users\Villex\dev\VillexShop\backoffice\src`): `components/ui/{Button,Select,EmptyState,PageHeader,Breadcrumbs,ThreeDotsLoader}.tsx` + sus `.test.tsx` → `panel/src/componentes/ui/`; `components/ui/dialog/*` → `componentes/ui/dialogo/`; `components/layouts/{Sidebar,Header}.tsx` → `componentes/layouts/`; `__tests__/{contrasteTokens,coloresCableados,botonesCableados,selectNativo,iconosSvg,jergaInline,animacionesVivas}.test.ts` → `panel/src/__tests__/`; `lib/utils.ts` (`cn`) → `panel/src/lib/cn.ts`.

**Interfaces:**
- Produces: tokens en `index.css` (dark por defecto para el marco, `.light` papel, `.light .marco-tinta`), clases utilitarias `.h-page`, `.h-section`, `.t-body`, `.t-muted`, `.btn-primario`; primitivas `Button` (variantes `primary|secondary|outline|ghost|destructive`, `loading`), `Select`, `EmptyState({icon, titulo, descripcion, accion?})`, `PageHeader({titulo, descripcion?, icono?, acciones?})`, `Breadcrumbs`, `Dialogo` (Radix); guards que rompen `vitest` ante colores cableados, `<select>` nativo, SVG a mano, botones armados a mano, jerga, animaciones inexistentes, contraste < 4,5:1.

- [ ] **Step 1: `package.json`**

```json
{
  "name": "covicen-panel",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 5174",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "lint": "eslint . --max-warnings 0",
    "test": "vitest run",
    "verificar": "pnpm lint && pnpm test && pnpm build"
  },
  "dependencies": {
    "@radix-ui/react-alert-dialog": "^1.1.7", "@radix-ui/react-dialog": "^1.1.7", "@radix-ui/react-dropdown-menu": "^2.1.7",
    "@radix-ui/react-select": "^2.1.7", "@radix-ui/react-tabs": "^1.1.3", "@radix-ui/react-toast": "^1.2.7", "@radix-ui/react-tooltip": "^1.1.10",
    "@tanstack/react-query": "^5.102.0", "clsx": "^2.1.1", "date-fns": "^4.1.0", "lucide-react": "^1.41.0",
    "react": "^18.3.1", "react-dom": "^18.3.1", "react-router": "^7.18.0", "tailwind-merge": "^2.5.5"
  },
  "devDependencies": {
    "@fontsource-variable/archivo": "^5.2.0", "@testing-library/jest-dom": "^6.9.0", "@testing-library/react": "^16.3.0",
    "@testing-library/user-event": "^14.6.0", "@types/react": "^18.3.18", "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^5.0.0", "autoprefixer": "^10.4.20", "eslint": "^9.18.0", "typescript-eslint": "^8.24.0",
    "eslint-plugin-react-hooks": "^5.1.0", "jsdom": "^26.1.0", "postcss": "^8.4.49", "tailwindcss": "^3.4.19",
    "typescript": "~5.9.0", "vite": "^8.2.0", "vitest": "^5.0.0", "msw": "^2.7.0"
  }
}
```

Instalar con `pnpm install`; si `@vitejs/plugin-react` no soporta Vite 8 en su versión mayor actual, usar la que `pnpm` sugiera (peer dep) y anotarlo. `react-router` v7 en modo librería (`createBrowserRouter`, `RouterProvider`), sin framework mode.

- [ ] **Step 2: `vite.config.ts` con proxy a Django y Vitest**

```ts
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: { '/api': { target: process.env.API_URL ?? 'http://localhost:8000', changeOrigin: false } },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
```

- [ ] **Step 3: `index.css`: copiar el de V-Shop y re-tokenizar la marca**

Copiar `VillexShop/backoffice/src/index.css` completo y cambiar **solo** estas variables (los tres bloques: `:root`, `.dark, .light .marco-tinta`, `.light, .light .marco-tinta .papel`):

| Token | Marco / oscuro (`:root` y `.marco-tinta`) | Papel (`.light`) |
|---|---|---|
| `--background` / `--surface` / `--card` / `--surface-raised` / `--popover` | navy: `216 55% 6%` / `216 50% 9%` / `216 45% 11%` / `216 40% 14%` / `216 40% 14%` | igual que V-Shop (`220 14% 96%` / `220 14% 98%` / `0 0% 100%` …) |
| `--primary` / `--primary-hover` / `--primary-foreground` / `--primary-subtle` | `198 68% 64%` (#68BCE1) / `198 72% 72%` / `216 55% 6%` / `198 40% 16%` | `203 53% 37%` (#2C688F) / `203 53% 31%` / `0 0% 100%` / `198 70% 93%` |
| `--accent` / `--accent-hover` / `--accent-foreground` / `--accent-subtle` | `49 87% 52%` (#F0C419) / `49 90% 60%` / `216 55% 6%` / `49 45% 16%` | `44 95% 30%` / `44 95% 25%` / `0 0% 100%` / `49 85% 92%` |
| `--ink`, `--ink-hover`, `--ink-foreground`, semánticos, bordes, `--radius` | sin cambios (V-Shop) | sin cambios |

Reemplazar la importación de DM Sans por `@import '@fontsource-variable/archivo';` y `font-family: 'Archivo Variable', system-ui, sans-serif` en `body`. Borrar los radiales del `body` y toda clase `glass-*`. El `.btn-primario` queda con `--filo-a: hsl(var(--primary))` y `--filo-b: hsl(var(--accent))` (celeste → vial). `html` arranca con `class="light"`.

- [ ] **Step 4: `tailwind.config.js`: copiar el de V-Shop (colores `hsl(var(--x))`, `borderRadius`, `fontFamily.sans = ['Archivo Variable', ...]`), quitar `backgroundImage.brand-gradient*` y `boxShadow.glow-*`.**

- [ ] **Step 5: Copiar primitivas, layouts y guards; adaptar imports (`@/` → rutas relativas o alias `@` en `tsconfig` + `vite.config`); reemplazar textos "V-Shop"/"tienda" por "Covicen"/"panel" en los guards de jerga.** El guard `contrasteTokens.test.ts` recalcula los 44 pares sobre **este** `index.css`: si alguno baja de 4,5:1 con la marca nueva, ajustar la luminosidad del token (no el test) hasta que pase, y anotar el valor final en `obsidian/Sistema de diseno del panel.md`.

- [ ] **Step 6: `main.tsx` mínimo con `<Shell>` vacío, `pnpm test` → los guards y los tests de primitivas en verde; `pnpm build` → OK. Commit: `feat(panel): scaffold con tokens de Covicen, primitivas, shell y guards de diseño`**

### Task 15: Cliente HTTP con CSRF, sesión, rutas protegidas, login

**Files:**
- Create: `panel/src/servicios/http.ts`, `panel/src/servicios/sesion.ts`, `panel/src/app/{providers,router,rutas-protegidas}.tsx`, `panel/src/lib/permisos.ts`, `panel/src/paginas/ingresar/Ingresar.tsx`, `panel/src/paginas/mi-cuenta/MiCuenta.tsx`, tests: `panel/src/servicios/http.test.ts`, `panel/src/paginas/ingresar/Ingresar.test.tsx`, `panel/src/test-utils/{render,msw}.tsx`

**Interfaces:**
- Produces: `http.get<T>(url)`, `http.post<T>(url, body)`, `http.patch`, `http.put`, `http.delete`, `http.subir(url, FormData)`: mismo origen, `credentials: 'same-origin'`, header `X-CSRFToken` leído de la cookie `csrftoken`, `Accept: application/json`; lanza `ErrorHttp` con `{status, codigo?, detail, campos?}`; en 401 emite el evento `sesion-vencida`. `useSesion()` → `{ yo, cargando, puede(permiso), entrar(email, clave), salir() }`. `<RutaProtegida permiso?>`. Tipos `Yo = { id, email, first_name, last_name, grupos: string[], permisos: string[], debe_cambiar_contrasena }`.

- [ ] **Step 1: Tests**

```ts
// panel/src/servicios/http.test.ts
import { describe, expect, it, beforeEach } from 'vitest';
import { http, ErrorHttp } from './http';
import { server } from '../test-utils/msw';
import { http as msw, HttpResponse } from 'msw';

describe('http', () => {
  beforeEach(() => { document.cookie = 'csrftoken=abc123'; });

  it('manda X-CSRFToken en las escrituras y no en las lecturas', async () => {
    let cabeceras: Headers | undefined;
    server.use(msw.post('/api/panel/x/', ({ request }) => { cabeceras = request.headers; return HttpResponse.json({ ok: true }); }));
    await http.post('/api/panel/x/', { a: 1 });
    expect(cabeceras?.get('x-csrftoken')).toBe('abc123');
  });

  it('convierte un 409 con codigo en ErrorHttp', async () => {
    server.use(msw.patch('/api/panel/cuadros/1/', () => HttpResponse.json({ codigo: 'estado_invalido', detail: 'No se edita' }, { status: 409 })));
    await expect(http.patch('/api/panel/cuadros/1/', {})).rejects.toMatchObject({ status: 409, codigo: 'estado_invalido', detail: 'No se edita' } satisfies Partial<ErrorHttp>);
  });

  it('en 401 avisa que la sesión venció', async () => {
    server.use(msw.get('/api/panel/inicio/', () => HttpResponse.json({ detail: 'Sin sesión.' }, { status: 401 })));
    const aviso = new Promise((res) => window.addEventListener('sesion-vencida', res, { once: true }));
    await expect(http.get('/api/panel/inicio/')).rejects.toBeInstanceOf(ErrorHttp);
    await aviso;
  });
});
```

```tsx
// panel/src/paginas/ingresar/Ingresar.test.tsx
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http as msw, HttpResponse } from 'msw';
import { server } from '../../test-utils/msw';
import { render } from '../../test-utils/render';
import { Ingresar } from './Ingresar';

it('muestra un solo mensaje ante credenciales incorrectas', async () => {
  server.use(msw.post('/api/panel/sesion/', () => HttpResponse.json({ detail: 'Email o contraseña incorrectos.' }, { status: 400 })));
  render(<Ingresar />);
  await userEvent.type(screen.getByLabelText('Email'), 'ana@covicen.com.ar');
  await userEvent.type(screen.getByLabelText('Contraseña'), 'mala');
  await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }));
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Email o contraseña incorrectos.'));
});
```

`test-utils/msw.tsx` levanta `setupServer()` de `msw/node` en `test-setup.ts` (`beforeAll(listen)`, `afterEach(resetHandlers)`, `afterAll(close)`); `test-utils/render.tsx` envuelve con `QueryClientProvider` (retry: false) y `MemoryRouter`.

- [ ] **Step 2: Implementación**

```ts
// panel/src/servicios/http.ts
export class ErrorHttp extends Error {
  constructor(public status: number, public detail: string, public codigo?: string, public campos?: Record<string, string[]>) {
    super(detail);
  }
}

function csrf(): string {
  return document.cookie.split('; ').find((c) => c.startsWith('csrftoken='))?.split('=')[1] ?? '';
}

async function pedir<T>(metodo: string, url: string, cuerpo?: unknown, formulario?: FormData): Promise<T> {
  const cabeceras: Record<string, string> = { Accept: 'application/json' };
  if (metodo !== 'GET') cabeceras['X-CSRFToken'] = csrf();
  if (cuerpo !== undefined) cabeceras['Content-Type'] = 'application/json';
  const r = await fetch(url, { method: metodo, credentials: 'same-origin', headers: cabeceras, body: formulario ?? (cuerpo === undefined ? undefined : JSON.stringify(cuerpo)) });
  if (r.status === 204) return undefined as T;
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401) window.dispatchEvent(new Event('sesion-vencida'));
    const { detail, codigo, ...campos } = datos as { detail?: string; codigo?: string } & Record<string, string[]>;
    throw new ErrorHttp(r.status, detail ?? 'Algo falló. Probá de nuevo.', codigo, Object.keys(campos).length ? campos : undefined);
  }
  return datos as T;
}

export const http = {
  get: <T>(url: string) => pedir<T>('GET', url),
  post: <T>(url: string, cuerpo?: unknown) => pedir<T>('POST', url, cuerpo),
  patch: <T>(url: string, cuerpo: unknown) => pedir<T>('PATCH', url, cuerpo),
  put: <T>(url: string, cuerpo: unknown) => pedir<T>('PUT', url, cuerpo),
  delete: <T>(url: string) => pedir<T>('DELETE', url),
  subir: <T>(url: string, formulario: FormData) => pedir<T>('POST', url, undefined, formulario),
};
```

```ts
// panel/src/servicios/sesion.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, ErrorHttp } from './http';

export type Yo = { id: number; email: string; first_name: string; last_name: string; grupos: string[]; permisos: string[]; debe_cambiar_contrasena: boolean };
const CLAVE = ['sesion'];

export function useSesion() {
  const qc = useQueryClient();
  const yo = useQuery({
    queryKey: CLAVE,
    queryFn: async () => { try { return await http.get<Yo>('/api/panel/sesion/'); } catch (e) { if (e instanceof ErrorHttp && e.status === 401) return null; throw e; } },
    staleTime: 5 * 60_000,
  });
  const entrar = useMutation({
    mutationFn: async ({ email, clave }: { email: string; clave: string }) => { await http.get('/api/panel/csrf/'); return http.post<Yo>('/api/panel/sesion/', { email, password: clave }); },
    onSuccess: (datos) => qc.setQueryData(CLAVE, datos),
  });
  const salir = useMutation({ mutationFn: () => http.delete('/api/panel/sesion/'), onSuccess: () => qc.setQueryData(CLAVE, null) });
  const puede = (permiso: string) => yo.data?.permisos.includes(permiso) ?? false;
  return { yo: yo.data ?? null, cargando: yo.isPending, puede, entrar, salir };
}
```

```tsx
// panel/src/app/rutas-protegidas.tsx
import { Navigate, Outlet, useLocation } from 'react-router';
import { ThreeDotsLoader } from '../componentes/ui/ThreeDotsLoader';
import { useSesion } from '../servicios/sesion';

export function RutaProtegida({ permiso }: { permiso?: string }) {
  const { yo, cargando, puede } = useSesion();
  const ubicacion = useLocation();
  if (cargando) return <ThreeDotsLoader />;
  if (!yo) return <Navigate to="/ingresar" replace state={{ desde: ubicacion.pathname }} />;
  if (yo.debe_cambiar_contrasena && ubicacion.pathname !== '/mi-cuenta') return <Navigate to="/mi-cuenta" replace />;
  if (permiso && !puede(permiso)) return <Navigate to="/" replace />;
  return <Outlet />;
}
```

`app/router.tsx`: `createBrowserRouter` con `/ingresar` público y el resto bajo `<RutaProtegida>` dentro de `<Shell>` (layout con `Sidebar` + `Header` en `marco-tinta` y `<main>` papel). Rutas y permisos: `/` (todos), `/catalogo/rutas|ciudades|cabinas` (`tramo.view_cabina`), `/categorias` (`tarifario.view_categoriavehiculo`), `/cuadros`, `/cuadros/:id` (`tarifario.view_cuadro`), `/publicaciones` (`publicacion.view_publicacion`), `/usuarios` (`cuentas.view_usuario`), `/mi-cuenta`. `app/providers.tsx`: `QueryClientProvider` (retry 1 salvo 4xx), `Toast` de Radix, listener de `sesion-vencida` que limpia la query `sesion` y navega a `/ingresar`. El `Sidebar` arma el menú desde una lista `{ruta, etiqueta, icono, permiso}` filtrada por `puede`.

`Ingresar.tsx`: formulario con `Campo` (label + input + error), `Button type="submit" loading`, un `role="alert"` con `ErrorHttp.detail`; al entrar navega a `state.desde ?? '/'`. `MiCuenta.tsx`: formulario de cambio de contraseña contra `/api/panel/sesion/contrasena/`; si `debe_cambiar_contrasena`, muestra el aviso "Tenés que elegir una contraseña nueva antes de seguir".

- [ ] **Step 3: `pnpm test` → PASS; `pnpm dev` con Django levantado: entrar con el usuario de `cargar_demo`. Juli lo ve en `http://localhost:5174/ingresar`. Commit: `feat(panel): sesión por cookie con CSRF, rutas protegidas, ingreso y mi cuenta`**

### Task 16: Inicio (estado del tarifario)

**Files:**
- Create: `panel/src/servicios/inicio.ts`, `panel/src/paginas/inicio/Inicio.tsx`, `panel/src/paginas/inicio/Inicio.test.tsx`, `panel/src/componentes/ui/{Chip,TarjetaDato}.tsx`, `panel/src/lib/formato.ts`

**Interfaces:**
- Consumes: `GET /api/panel/inicio/` → `{ hoy, vigente: {id,nombre,vigencia_desde,vigencia_hasta}|null, proximo: …|null, pendientes: {borradores, en_revision}, cabinas: {activas, operativas}, publicaciones: Publicacion[] }`.
- Produces: `Chip({tono: 'neutro'|'success'|'warning'|'info'|'destructive', children})` (usa `-subtle` sólido), `TarjetaDato({titulo, valor, detalle?, icono})`, `formato.fecha(iso)` (`5/10/2026`), `formato.pesos(n)` (`$ 1.693`), `formato.diasDesde(iso)`.

- [ ] **Step 1: Test**: con `msw` que devuelve vigente "Oferta 2026" desde hace 3 días, próximo el 1/11/2026 y una publicación con `resultado_aviso: 'error'`, la página muestra "Rige desde el 6/9/2026", "Próximo cuadro: 1/11/2026", y un `Chip` "Aviso a la web con error" con el botón "Reintentar" solo si `puede('publicacion.add_publicacion')`.
- [ ] **Step 2: Implementación**: `useInicio()` (`useQuery`), `Inicio.tsx` con `PageHeader` "Inicio", una fila de `TarjetaDato` (Cuadro vigente, Próximo cuadro, Pendientes, Cabinas), la lista "Últimas publicaciones" (fecha, acción, usuario, `Chip` por resultado, botón Reintentar) y "Accesos rápidos" (`ButtonLink` a Nuevo cuadro, Cabinas, Publicaciones). Estados: `EmptyState` si no hay vigente ("Todavía no hay un cuadro publicado") con acción "Crear cuadro" si `puede('tarifario.add_cuadro')`.
- [ ] **Step 3: `pnpm test` → PASS. Commit: `feat(panel): inicio con el estado del tarifario`**

### Task 17: Catálogo: rutas, ciudades, cabinas (`ux-bro`)

**Files:**
- Create: `panel/src/servicios/catalogo.ts`, `panel/src/componentes/ui/{Tabla,Drawer,Campo,Interruptor}.tsx`, `panel/src/paginas/catalogo/{rutas/Rutas,ciudades/Ciudades,cabinas/Cabinas,cabinas/FormularioCabina,cabinas/VistaPreviaMapa}.tsx` y sus tests.

**Interfaces:**
- Consumes: `/api/panel/rutas/`, `/ciudades/`, `/trazados/`, `/cabinas/`, `/concesion/` (CRUD, lista con `?search=`).
- Produces: `Tabla<T>({columnas, filas, cargando, vacio: {icono, titulo, descripcion}, onFila?})`, `Drawer({abierto, titulo, onCerrar, children})` (Radix Dialog lateral, `.papel`), `Campo({label, error, children})`, `useCatalogo()` con `rutas`, `ciudades`, `cabinas` (queries) y mutations `crearCabina`, `editarCabina`, `desactivarCabina` con invalidación.

- [ ] **Step 1: Tests**: la tabla de cabinas muestra nombre, ruta, km, situación (`Chip`), estado, activa; el formulario valida `slug` (regex del contrato), `km ≥ 0`, `fuente_url` con `http`; guardar hace `POST` con el cuerpo esperado (msw captura); un 400 del servidor con `{fuente_url: ['...']}` aparece al lado del campo; "Desactivar" pide confirmación y hace `PATCH {activa:false}`.
- [ ] **Step 2: Implementación**: tres páginas con `PageHeader` + `Tabla` + botón "Nueva" que abre el `Drawer` con el formulario. `FormularioCabina` incluye `VistaPreviaMapa`: un `<svg viewBox="0 0 820 520">` con el trazado del mapa de la landing (copiar el path del `MapaTramo.astro` como constante) y un círculo en `(mapa_x, mapa_y)` que se mueve al editar los campos. Ciudades incluye el orden del trazado por ruta (lista ordenable simple con botones subir/bajar; sin drag and drop en v1). Concesión: un formulario chico en la página de rutas (km total y avisos).
- [ ] **Step 3: `pnpm test` → PASS; Juli revisa `/catalogo/cabinas` en el navegador. Commit: `feat(panel): catálogo del tramo con formularios en drawer y vista previa del mapa`**

### Task 18: Categorías de vehículo (`ux-bro`)

**Files:** `panel/src/servicios/categorias.ts`, `panel/src/paginas/categorias/Categorias.tsx` + test.

- [ ] Tabla ordenable (subir/bajar cambia `orden` con `PATCH`), alta/edición en `Drawer` (slug, nombre, descripción, activa). Borrar solo si `puede('tarifario.delete_categoriavehiculo')`; un 409 `en_uso` muestra "Esta categoría tiene tarifas: desactivala en vez de borrarla". Test de la tabla y del 409. Commit: `feat(panel): categorías de vehículo`

### Task 19: Cuadros: lista, detalle, grilla, acciones, historial (tech lead + `ux-bro`)

**Files:**
- Create: `panel/src/servicios/cuadros.ts`, `panel/src/lib/iva.ts`, `panel/src/paginas/cuadros/{lista/Cuadros,detalle/Cuadro,detalle/Encabezado,detalle/Grilla,detalle/BarraAcciones,detalle/Historial,detalle/DialogoPublicar}.tsx` y tests (`Grilla.test.tsx`, `BarraAcciones.test.tsx`, `iva.test.ts`).

**Interfaces:**
- Consumes: `/api/panel/cuadros/` (+ acciones y `PUT tarifas/`), `/api/panel/categorias/`, `/api/panel/cabinas/`, `/api/panel/historial/?modelo=tarifario.cuadro&id=`.
- Produces: `calcularConIva(montoSinIva: string|null, alicuota: string, redondeo: 'peso'|'centavo'): string|null` (mismo resultado que el backend: `Intl`-independiente, `Decimal` a mano con `BigInt` de centésimas: 1399 → "1693"); `Grilla({cuadro, categorias, cabinas, editable, onGuardar(filas)})`; `BarraAcciones({cuadro, puede, onAccion})`.

- [ ] **Step 1: Tests**

```ts
// panel/src/lib/iva.test.ts
import { calcularConIva } from './iva';
it.each([['1399', 'peso', '1693'], ['1399', 'centavo', '1692.79'], ['0.50', 'peso', '1'], [null, 'peso', null]])
  ('%s con redondeo %s → %s', (monto, redondeo, esperado) => {
    expect(calcularConIva(monto as string | null, '0.210', redondeo as 'peso' | 'centavo')).toBe(esperado);
  });
```

```tsx
// panel/src/paginas/cuadros/detalle/Grilla.test.tsx (resumen de casos)
// 1. Muestra una fila por categoría activa con el monto general y, a la derecha, el monto con IVA calculado.
// 2. "Agregar excepción" abre un Select de cabina y agrega la fila categoría × cabina; no permite dos excepciones iguales.
// 3. Un monto no positivo marca error y deshabilita Guardar.
// 4. Guardar manda PUT /api/panel/cuadros/1/tarifas/ con { modificado_en, filas: [...] } (msw captura el cuerpo).
// 5. Un 409 'cuadro_modificado' muestra "Otra persona guardó este cuadro..." con el botón "Recargar".
// 6. Si editable=false, todos los inputs son de solo lectura y no hay botón Guardar.
```

```tsx
// panel/src/paginas/cuadros/detalle/BarraAcciones.test.tsx (resumen)
// borrador + Carga → "Enviar a revisión", "Duplicar"; sin "Publicar".
// en_revision + Publicación → "Publicar", "Volver a borrador"; Publicar abre DialogoPublicar que dice qué cuadro se cierra y desde cuándo rige.
// publicado + Publicación → "Archivar" (con advertencia de que la web queda sin cuadro si es el vigente) y "Duplicar"; nada de editar.
```

- [ ] **Step 2: Implementación**

```ts
// panel/src/lib/iva.ts
/** Réplica exacta de tarifario.models.redondear: half-up sobre centésimas, sin flotantes. */
export function calcularConIva(montoSinIva: string | null, alicuota: string, redondeo: 'peso' | 'centavo'): string | null {
  if (montoSinIva === null || montoSinIva === '') return null;
  const aCentesimas = (s: string) => { const [e, d = ''] = s.split('.'); return BigInt(e) * 100n + BigInt((d + '00').slice(0, 2)); };
  const aMilesimas = (s: string) => { const [e, d = ''] = s.split('.'); return BigInt(e) * 1000n + BigInt((d + '000').slice(0, 3)); };
  const bruto = aCentesimas(montoSinIva) * (1000n + aMilesimas(alicuota)); // en cienmilésimas
  if (redondeo === 'centavo') {
    const cent = (bruto + 500n) / 1000n;
    return `${cent / 100n}.${(cent % 100n).toString().padStart(2, '0')}`;
  }
  return ((bruto + 50_000n) / 100_000n).toString();
}
```

**Etiquetas fijas (el E2E de la Tarea 24 las usa tal cual):** botones "Guardar encabezado", "Guardar grilla", "Enviar a revisión", "Volver a borrador", "Publicar", "Archivar", "Duplicar", "Agregar excepción", "Recargar"; labels "Nombre", "Rige desde", "Descripción de la vigencia", "Fuente", "Link de la fuente"; el input de monto lleva `name="monto"` y `aria-label` "Monto sin IVA de <categoría>"; el `Chip` del aviso dice "Aviso a la web ok" / "Aviso a la web omitido" / "Aviso a la web con error".

`Grilla.tsx`: estado local `filas: {categoria, cabina: string|null, monto_sin_iva: string, nota}[]` inicializado desde `cuadro.tarifas`; render como tabla con la categoría en la primera columna, el input de monto, el monto con IVA (`calcularConIva`) en texto `t-muted tabular-nums`, la nota, y el botón de quitar excepción; encabezado con `alicuota_iva` y `redondeo` (editables en `Encabezado`, no acá). `onGuardar` manda `PUT` con `modificado_en: cuadro.modificado_en`; en éxito invalida `['cuadro', id]`; en 409 muestra el mensaje y el botón Recargar (refetch). `Encabezado.tsx`: nombre, vigencia_desde (input date), vigencia_descripcion, origen (`Select`), alícuota, redondeo, fuente (nombre + link), avisos (lista de hasta 5), notas internas (editable siempre), PDF de la resolución (`subir` con `FormData`, enlace de descarga al host de la API). Guardado del encabezado con `PATCH` y mensajes por campo. `Historial.tsx`: lista de cambios (fecha, usuario, campo, antes → después) con `EmptyState` "Sin cambios todavía". `Cuadros.tsx` (lista): tabla con `Chip` de estado (borrador neutro, en revisión info, publicado success, archivado neutro), vigencias, publicado por; filtro por estado (`Select`); botón "Nuevo cuadro" (`POST` con nombre y navegación al detalle).

- [ ] **Step 3: `pnpm test` → PASS; flujo completo en el navegador: nuevo → grilla → enviar a revisión → publicar (con `cargar_demo`, el aviso sale "omitido"). Commit: `feat(panel): cuadros con grilla, acciones por estado, historial y publicación`**

### Task 20: Publicaciones y usuarios (`ux-bro`)

**Files:** `panel/src/servicios/{publicaciones,usuarios}.ts`, `panel/src/paginas/publicaciones/Publicaciones.tsx`, `panel/src/paginas/usuarios/{Usuarios,FormularioUsuario}.tsx` + tests.

- [ ] Publicaciones: tabla (fecha, acción, cuadro, usuario, resultado como `Chip`, detalle en un `Tooltip`), botón "Reintentar" si `puede('publicacion.add_publicacion')` y resultado ≠ ok; un 429 muestra "Esperá un minuto antes de reintentar". Usuarios: tabla (email, nombre, grupos, activo, último ingreso), alta en `Drawer` (email, nombre, apellido, grupos como casillas de los tres), al crear muestra **una sola vez** la contraseña temporal en un `Dialogo` con botón "Copiar"; "Restablecer contraseña" ídem; activar/desactivar con confirmación. Tests: el diálogo de contraseña temporal no vuelve a mostrarse al cerrar; Carga no ve el menú Usuarios. Commit: `feat(panel): publicaciones con reintento y administración de usuarios`

### Task 21: Imagen del panel (Caddy) y job `panel` en CI (`ops-bro`)

**Files:** `panel/Dockerfile`, `panel/Caddyfile.local` (no; el Caddyfile real es de `infra/`), `.github/workflows/ci.yml` (job `panel`), `panel/eslint.config.js`.

- [ ] **Step 1: Dockerfile multi-stage**: `node:24-alpine` con `pnpm` (`corepack enable`) → `pnpm install --frozen-lockfile && pnpm build` → `caddy:2-alpine` copiando `dist/` a `/srv/panel`. El `Caddyfile` se monta desde `infra/caddy/` (Tarea 23).
- [ ] **Step 2: Job `panel`**: `actions/setup-node@<SHA>` (Node 24, cache pnpm) → `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm test` → `pnpm build` → `pnpm audit --audit-level=high`. `eslint.config.js` plano con `typescript-eslint` recomendado + `react-hooks`.
- [ ] **Step 3: PR de prueba con el job verde. Commit: `ci(panel): lint, tests, build y auditoría; imagen Caddy del panel`**

**Cierre de la Fase C:** `rev-bro` revisa Tareas 14 a 20 contra §8 y el tema del panel (guards en verde, `tsc`, `eslint`, `vitest`, `pnpm build`). Juli hace la validación visual completa en su navegador con la demo local antes de la Fase D.

---

## Fase D — Landing, producción, punta a punta y cierre

### Task 22: Landing: fuente API real, composición, workflow con reconstrucción (repo `Covicen`)

**Files:**
- Modify: `src/lib/config.ts`, `src/lib/datos/fuentes/api.ts`, `src/lib/datos/index.ts`, `.github/workflows/pages.yml`, `obsidian/Costura de datos.md`, `obsidian/Home.md`
- Create: `tests/datos/fuente-api.test.ts`, `tests/fixtures/api/tramo.json`, `tests/fixtures/api/tarifario.json` (generados con `curl` contra la demo local y **validados por Zod** en el test)

**Interfaces:**
- Consumes: `GET {API_URL}/api/v1/tramo/` y `/api/v1/tarifario/` con la forma de `esquemaTramo` y `esquemaTarifario`.
- Produces: `config.apiUrl` (de `API_URL`, sin barra final); `fuenteApi: Pick<FuenteDatos, 'tramo' | 'tarifario'>`; `datos` compuesto cuando `FUENTE_DATOS=api`.

- [ ] **Step 1: Tests**

```ts
// tests/datos/fuente-api.test.ts
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { esquemaTarifario, esquemaTramo } from '../../src/lib/datos/esquemas';
import { fuenteApi } from '../../src/lib/datos/fuentes/api';

const fixture = (n: string) => JSON.parse(readFileSync(`tests/fixtures/api/${n}.json`, 'utf8'));
const responder = (cuerpo: unknown, status = 200) =>
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } }));

afterEach(() => vi.restoreAllMocks());

describe('fuenteApi', () => {
  it('los fixtures cumplen el contrato', () => {
    esquemaTramo.parse(fixture('tramo'));
    esquemaTarifario.parse(fixture('tarifario'));
  });
  it('tarifario() devuelve datos validados', async () => {
    responder(fixture('tarifario'));
    const t = await fuenteApi.tarifario();
    expect(t.tarifas[1].montoSinIva).toBe(1399);
  });
  it('rompe con mensaje claro si el servidor devuelve otra forma', async () => {
    responder({ tarifas: 'no' });
    await expect(fuenteApi.tarifario()).rejects.toThrow(/FuenteApi: la respuesta de \/api\/v1\/tarifario\/ no cumple el contrato/);
  });
  it('rompe con mensaje claro ante 404 (sin cuadro vigente) y no publica basura', async () => {
    responder({ detail: 'No hay un cuadro tarifario vigente para esa fecha.' }, 404);
    await expect(fuenteApi.tarifario()).rejects.toThrow(/404/);
  });
  it('los textos del sistema se tratan como texto: un aviso con HTML llega escapado al componente', async () => {
    responder({ ...fixture('tarifario'), avisos: ['<img src=x onerror=alert(1)>'] });
    const t = await fuenteApi.tarifario();
    expect(t.avisos[0]).toContain('<img'); // el contrato no filtra: el componente lo pinta como texto (verificado en tests/componentes)
  });
});
```

Y en `tests/componentes/` (donde ya están los tests de la Container API): un test que renderiza el componente del tarifario con un aviso `<b>x</b>` y comprueba que el HTML de salida contiene `&lt;b&gt;` (texto escapado, nunca `set:html`).

- [ ] **Step 2: Implementación**

```ts
// src/lib/config.ts (agregar)
  /** Origen de la API del sistema (sin barra final). Obligatorio con FUENTE_DATOS=api. */
  apiUrl: oDefecto(import.meta.env.API_URL, '').replace(/\/+$/, ''),
// y después del bloque de validación de `fuente`:
if (fuente === 'api' && !oDefecto(import.meta.env.API_URL, '')) {
  throw new Error('FUENTE_DATOS=api exige API_URL (ej. https://api.covicen.com.ar)');
}
```

```ts
// src/lib/datos/fuentes/api.ts
import { config } from '@/lib/config';
import type { FuenteDatos } from '../fuente';
import { esquemaTarifario, esquemaTramo } from '../esquemas';
import type { ZodType } from 'astro/zod';

// Acá está Django. Cada método hace fetch + esquemaX.parse: el contrato manda.
// Lo que el sistema todavía no tiene (empresa, contacto, obras, novedades, FAQ, estado de rutas) NO se implementa acá:
// index.ts lo sigue leyendo del repo. Esta fuente no mockea nada.
async function leer<T>(ruta: string, esquema: ZodType<T>): Promise<T> {
  const url = `${config.apiUrl}${ruta}`;
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`FuenteApi: ${ruta} respondió ${r.status}. No se publica la web sin datos válidos.`);
  const resultado = esquema.safeParse(await r.json());
  if (!resultado.success) {
    throw new Error(`FuenteApi: la respuesta de ${ruta} no cumple el contrato:\n${resultado.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')}`);
  }
  return resultado.data;
}

export const fuenteApi: Pick<FuenteDatos, 'tramo' | 'tarifario'> = {
  tramo: () => leer('/api/v1/tramo/', esquemaTramo),
  tarifario: () => leer('/api/v1/tarifario/', esquemaTarifario),
};
```

```ts
// src/lib/datos/index.ts (reemplazar la última línea)
// FUENTE_DATOS=api: la API para lo que el sistema ya tiene; el repo para el resto. Sin mocks.
export const datos: FuenteDatos = config.fuenteDatos === 'api' ? { ...fuenteLocal, ...fuenteApi } : fuenteLocal;
```

- [ ] **Step 3: Workflow**

```yaml
# .github/workflows/pages.yml (cambios)
on:
  push: { branches: [main] }
  workflow_dispatch:
  repository_dispatch: { types: [datos-publicados] }
  schedule: [{ cron: "0 6 * * *" }]   # 03:00 en Argentina: los cuadros a futuro entran solos
# en jobs.build.env:
      FUENTE_DATOS: ${{ vars.API_URL != '' && 'api' || 'local' }}
      API_URL: ${{ vars.API_URL }}
```

`client_payload` no se usa en ningún `run:`. Hasta que exista el VPS no se define la variable `API_URL` y el build sigue en `local`.

- [ ] **Step 4: Fixtures reales**: con la demo local corriendo, `curl -s localhost:8000/api/v1/tramo/ > tests/fixtures/api/tramo.json` y lo mismo para `tarifario`. Correr `pnpm test`, `pnpm check` y un build de prueba: `FUENTE_DATOS=api API_URL=http://localhost:8000 pnpm build && pnpm verificar` → la landing construida muestra el cuadro de la demo. Actualizar `obsidian/Costura de datos.md` (sección "Cómo conectar Django mañana" pasa a "Cómo está conectado") y el estado en `Home.md`. Commit en `Covicen`: `feat(datos): fuente API para tramo y tarifario, reconstrucción por repository_dispatch y diaria`

### Task 23: Producción: compose, Caddy, backups cifrados, deploy y runbooks (`ops-bro`)

**Files:**
- Create: `infra/compose.prod.yaml`, `infra/caddy/Caddyfile`, `infra/backup/{Dockerfile,backup.sh,restore.sh}`, `.github/workflows/deploy.yml`, `docs/runbooks/{vps.md,backup-restore.md,token-github.md,usuarios.md,deploy-fallido.md}`
- Modify: `infra/.env.ejemplo` (claves de prod: `DOMINIO_PANEL`, `DOMINIO_API`, `CSRF_TRUSTED_ORIGINS`, `BACKUP_AGE_PUBLIC_KEY`)

- [ ] **Step 1: `compose.prod.yaml`**

```yaml
name: covicen
services:
  db:
    image: postgres:17
    env_file: .env
    volumes: [db:/var/lib/postgresql/data]
    restart: unless-stopped
    healthcheck: { test: ["CMD-SHELL", "pg_isready -U $$POSTGRES_USER -d $$POSTGRES_DB"], interval: 10s, retries: 10 }
  backend:
    image: ghcr.io/juliv08/covicen-backend:${TAG:-latest}
    env_file: .env
    environment: { DJANGO_SETTINGS_MODULE: config.settings.prod }
    volumes: [media:/app/media]
    depends_on: { db: { condition: service_healthy } }
    restart: unless-stopped
    healthcheck: { test: ["CMD-SHELL", "python -c \"import urllib.request;urllib.request.urlopen('http://localhost:8000/api/v1/salud/')\""], interval: 30s, retries: 5 }
  panel:
    image: ghcr.io/juliv08/covicen-panel:${TAG:-latest}
    env_file: .env
    ports: ["80:80", "443:443", "443:443/udp"]
    volumes: [./caddy/Caddyfile:/etc/caddy/Caddyfile:ro, media:/srv/media:ro, caddy_data:/data, caddy_config:/config]
    depends_on: [backend]
    restart: unless-stopped
  backup:
    build: ./backup
    env_file: .env
    volumes: [backups:/backups]
    depends_on: { db: { condition: service_healthy } }
    restart: unless-stopped
volumes: { db: {}, media: {}, backups: {}, caddy_data: {}, caddy_config: {} }
```

Ni `db` ni `backend` publican puertos: solo Caddy.

- [ ] **Step 2: `Caddyfile`**

```caddyfile
{$DOMINIO_PANEL} {
	encode zstd gzip
	request_body { max_size 12MB }
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Content-Type-Options nosniff
		X-Frame-Options DENY
		Referrer-Policy strict-origin-when-cross-origin
		Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"
		-Server
	}
	handle /api/* {
		reverse_proxy backend:8000 {
			header_up X-Forwarded-For {remote_host}
			header_up X-Forwarded-Proto {scheme}
		}
	}
	handle {
		root * /srv/panel
		try_files {path} /index.html
		file_server
	}
}

{$DOMINIO_API} {
	encode zstd gzip
	header {
		Strict-Transport-Security "max-age=31536000; includeSubDomains"
		X-Content-Type-Options nosniff
		Referrer-Policy no-referrer
		-Server
	}
	@publica path /api/v1/* /api/schema/* /api/docs/*
	handle @publica {
		reverse_proxy backend:8000 {
			header_up X-Forwarded-For {remote_host}
			header_up X-Forwarded-Proto {scheme}
		}
	}
	handle_path /media/* {
		root * /srv/media
		header Content-Disposition attachment
		header Content-Security-Policy sandbox
		file_server
	}
	handle {
		respond 404
	}
}
```

Django: `MEDIA_URL = env('MEDIA_URL', default='/media/')` y en prod `MEDIA_URL = https://{DOMINIO_API}/media/` para que el panel enlace el PDF al host de la API. Verificar con `docker compose -f infra/compose.prod.yaml config` y `caddy validate --config infra/caddy/Caddyfile --adapter caddyfile` (en un contenedor `caddy:2-alpine`).

- [ ] **Step 3: Backup cifrado**

```bash
#!/bin/sh
# infra/backup/backup.sh  (corre por cron a las 03:30, retención 14 días)
set -eu
FECHA=$(date +%Y%m%d-%H%M)
DESTINO=/backups/covicen-$FECHA.sql.age
pg_dump -h db -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner | age -r "$BACKUP_AGE_PUBLIC_KEY" > "$DESTINO"
chmod 600 "$DESTINO"
find /backups -name 'covicen-*.sql.age' -mtime +14 -delete
echo "backup ok: $DESTINO"
```

`Dockerfile`: `postgres:17` + `age` + `cron` (`echo "30 3 * * * /backup.sh" | crontab -`). `restore.sh`: `age -d -i /clave-privada.txt archivo.sql.age | psql ...`, documentado y **probado** en el runbook (restaurar en un contenedor aparte y contar filas de `tarifario_cuadro`). La clave privada de `age` **no** vive en el VPS: la guarda Juli (gestor de contraseñas). La copia externa (rclone a un bucket con credencial de solo escritura) queda documentada y se activa cuando Covicen tenga el bucket.

- [ ] **Step 4: `deploy.yml`**

```yaml
name: Deploy
on:
  workflow_run: { workflows: [CI], types: [completed], branches: [main] }
permissions: { contents: read, packages: write }
jobs:
  deploy:
    if: ${{ github.event.workflow_run.conclusion == 'success' && vars.DEPLOY_HOST != '' }}
    runs-on: ubuntu-latest
    environment: prod
    steps:
      - uses: actions/checkout@<SHA>
      - uses: docker/login-action@<SHA>
        with: { registry: ghcr.io, username: "${{ github.actor }}", password: "${{ secrets.GITHUB_TOKEN }}" }
      - uses: docker/build-push-action@<SHA>
        with: { context: backend, target: prod, push: true, tags: "ghcr.io/juliv08/covicen-backend:${{ github.sha }},ghcr.io/juliv08/covicen-backend:latest" }
      - uses: docker/build-push-action@<SHA>
        with: { context: panel, push: true, tags: "ghcr.io/juliv08/covicen-panel:${{ github.sha }},ghcr.io/juliv08/covicen-panel:latest" }
      - name: Desplegar por SSH
        env:
          SSH_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
          KNOWN_HOSTS: ${{ vars.DEPLOY_KNOWN_HOSTS }}
          HOST: ${{ vars.DEPLOY_HOST }}
          TAG: ${{ github.sha }}
        run: |
          mkdir -p ~/.ssh && echo "$SSH_KEY" > ~/.ssh/id_ed25519 && chmod 600 ~/.ssh/id_ed25519
          echo "$KNOWN_HOSTS" > ~/.ssh/known_hosts
          ssh -i ~/.ssh/id_ed25519 deploy@"$HOST" "cd /srv/covicen && git pull --ff-only && TAG=$TAG docker compose -f infra/compose.prod.yaml pull && TAG=$TAG docker compose -f infra/compose.prod.yaml up -d --remove-orphans && sleep 10 && curl -fsS https://\$(grep DOMINIO_API infra/.env | cut -d= -f2)/api/v1/salud/"
```

El usuario `deploy` del VPS solo tiene permiso sobre `/srv/covicen` y el grupo `docker`; el repo en el VPS se clona con un *deploy key* de solo lectura. Rollback: `TAG=<sha anterior> docker compose up -d`.

- [ ] **Step 5: Runbooks** (`docs/runbooks/`), cada uno con comandos copiables: `vps.md` (Ubuntu 24.04: usuario `deploy`, `ufw` 22/80/443, `fail2ban`, `unattended-upgrades`, Docker, clonar el repo, `.env` de prod, DNS `panel`/`api` → IP, primer `up`, `cargar_demo` **no** se corre en prod: alta del primer usuario con `manage.py createsuperuser` + agregarlo al grupo Administración por `shell`), `backup-restore.md` (probado), `token-github.md` (crear el fine-grained token, dónde va, cómo se rota), `usuarios.md` (alta, roles, contraseña temporal), `deploy-fallido.md` (leer logs, volver al tag anterior).

- [ ] **Step 6: Verificación sin VPS**: `docker compose -f infra/compose.prod.yaml config` válido; `caddy validate` OK; `docker compose -f infra/compose.prod.yaml build backup`; `deploy.yml` valida sintaxis con `actionlint`. Commit: `feat(infra): producción con Caddy, backups cifrados, deploy por SSH y runbooks`

### Task 24: Punta a punta en CI (`test-bro`)

**Files:** `e2e/package.json`, `e2e/playwright.config.ts`, `e2e/publicar.spec.ts`, `.github/workflows/ci.yml` (job `e2e`), `infra/compose.ci.yaml` (override: `backend` con `GITHUB_DISPATCH_TOKEN=` vacío y `panel` como imagen Caddy construida)

- [ ] **Step 1: Spec**

```ts
// e2e/publicar.spec.ts
import { expect, test } from '@playwright/test';

test('editar una tarifa, publicar y verla en la API pública', async ({ page, request }) => {
  await page.goto('/ingresar');
  await page.getByLabel('Email').fill('demo@covicen.com.ar');
  await page.getByLabel('Contraseña').fill(process.env.DEMO_PASSWORD!);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page.getByRole('heading', { name: 'Inicio' })).toBeVisible();

  await page.goto('/cuadros');
  await page.getByRole('row', { name: /Oferta 2026/ }).click();
  await page.getByRole('button', { name: 'Duplicar' }).click();
  await page.getByLabel('Nombre').fill('Cuadro E2E');
  await page.getByLabel('Rige desde').fill('2027-01-01');
  await page.getByRole('button', { name: 'Guardar encabezado' }).click();
  await page.getByRole('cell', { name: /Autos y camionetas/ }).locator('input[name="monto"]').fill('1500');
  await page.getByRole('button', { name: 'Guardar grilla' }).click();
  await expect(page.getByText('1.815')).toBeVisible(); // 1500 × 1,21 = 1815
  await page.getByRole('button', { name: 'Enviar a revisión' }).click();
  await page.getByRole('button', { name: 'Publicar' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByText('Aviso a la web omitido')).toBeVisible();

  const r = await request.get('http://localhost:8000/api/v1/tarifario/?fecha=2027-01-02');
  expect(r.status()).toBe(200);
  const t = (await r.json()).tarifas.find((x: { categoria: string }) => x.categoria === 'cat-2');
  expect(t.montoSinIva).toBe(1500);
  expect(t.montoConIva).toBe(1815);
});
```

- [ ] **Step 2: Job `e2e`** en `ci.yml`: `needs: [backend, panel]`; levanta `docker compose -f infra/compose.yaml -f infra/compose.ci.yaml up -d --build`, espera `/api/v1/salud/`, corre `cargar_demo` con `DEMO_PASSWORD` de un secreto de CI, `pnpm --dir e2e exec playwright install --with-deps chromium`, `pnpm --dir e2e test` con `baseURL http://localhost:5174` (o el puerto del panel en el compose de CI), sube `playwright-report` como artefacto si falla. Los textos de los botones de este spec son **el contrato de la UI**: los componentes de la Fase C usan exactamente esos nombres accesibles.
- [ ] **Step 3: PR con los tres jobs verdes. Commit: `ci(e2e): publicar un cuadro de punta a punta con Playwright`**

### Task 25: Cierre: segunda pasada de seguridad, revisión final, verificación de la demo, documentación

- [ ] **Step 1: `sec-bro`** sobre `backend/apps/cuentas`, `apps/comun/permisos.py`, `apps/comun/historial.py`, `apps/tarifario/api_panel.py`, `infra/caddy/Caddyfile`, `infra/compose.prod.yaml`, `.github/workflows/*.yml` (condición (c) del veredicto de la spec §11.1). Hallazgos Altos se arreglan antes de seguir; Medios se arreglan o se anotan con fecha en `docs/runbooks/pendientes-seguridad.md`.
- [ ] **Step 2: `rev-bro`** revisión final de todo el repo `covicen-sistemas` y de los cambios en `Covicen`, con la suite completa, `tsc`, `eslint`, `pnpm build`, `astro check`, `pnpm verificar` y `docker compose config` corridos por él. Veredicto escrito.
- [ ] **Step 3: Verificación de la demo (superpowers:verification-before-completion)**, en la máquina de Juli, en este orden y pegando la salida real:

```bash
cd /c/Users/Villex/dev/covicen-sistemas
docker compose -f infra/compose.yaml up -d --build
docker compose -f infra/compose.yaml exec backend uv run pytest
docker compose -f infra/compose.yaml exec backend uv run python manage.py cargar_demo --email demo@covicen.com.ar --password "<clave>"
curl -s http://localhost:8000/api/v1/tarifario/ | head -c 300
cd panel && pnpm verificar && pnpm dev   # Juli entra en http://localhost:5174, cambia una tarifa, publica
cd /c/Users/Villex/dev/Covicen && FUENTE_DATOS=api API_URL=http://localhost:8000 pnpm build && pnpm verificar && pnpm preview
```

Listo = las siete líneas en verde y Juli ve en la landing local el monto que cambió en el panel.

- [ ] **Step 4: Documentación**: `README.md` del repo privado (qué es, cómo levantar, cómo correr tests, dónde están los runbooks); `obsidian/Home.md` y `obsidian/Sistemas de Covicen.md` en el repo público con el estado ("sistema 1 construido, demo local verificada, pendiente VPS"), `obsidian/Costura de datos.md` con la conexión real; `C:\Users\Villex\Obsidian\Proyectos\Covicen.md` con el estado y la lista de pendientes de Juli (spec §14) actualizada.
- [ ] **Step 5: Lista para Juli** (en el mensaje final, en criollo): qué quedó hecho, cómo lo prueba, qué falta de su lado (repo creado, VPS, dominio y DNS, token de GitHub, cuadro homologado, cabinas confirmadas, usuarios de Covicen, bucket de backups), y qué sigue (Licitaciones).

---

## Orden de ejecución y paralelismo

| Lote | Tareas | Quién | Depende de |
|---|---|---|---|
| 0 | 1, 2 | tech lead + ops-bro | Repo creado por Juli |
| A | 3, 4, 5, 6, 7 | tech lead inline (4 y factories: bk-bro en paralelo) | 0 |
| B | 8 (Covicen) ∥ 9, 10 (tech lead), 11 ∥ 12 (bk-bro), 13 (ops-bro) | | A; 9 depende de 8 |
| C | 14, 15 (tech lead) → 16 ∥ 17 ∥ 18 (ux-bro) → 19 (tech lead + ux-bro) → 20 ∥ 21 | | B (la API del panel tiene que existir para msw y para probar en vivo) |
| D | 22 (tech lead) ∥ 23 (ops-bro) → 24 (test-bro) → 25 | | C |

Revisión de `rev-bro` al cierre de cada lote; nunca sobre código propio. Commits por tarea solo con la autorización de Juli al arrancar.
