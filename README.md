# ARGO

**Software para CEAs** (Centros de Enseñanza Automovilística) — gestión de alumnos, matrículas, liquidaciones, caja, recibos, certificados y recursos humanos.

## Documentación

| Archivo | Para qué sirve |
|---------|----------------|
| **[ARGO-CONTEXTO.md](./ARGO-CONTEXTO.md)** | Contexto completo del sistema: arquitectura, módulos, permisos, modelos, API, rutas y convenciones. **Recomendado para IAs y nuevos desarrolladores.** |
| `argo-frontend/README.md` | Notas del proyecto Angular (CLI) |

## Módulos principales

- **Alumnos** — ficha, documentos, matrículas, pagos y certificados
- **Programas y servicios** — catálogo académico del CEA
- **Cobros** — liquidaciones y cartera por cobrar
- **Caja** — apertura por cajero, ingresos, egresos, arqueo, cierres y descuadres
- **Dashboard** — indicadores ejecutivos y resumen financiero
- **RRHH / nómina** — empleados, contratos, períodos y novedades
- **Configuración** — usuarios, roles y permisos (RBAC), catálogos, recibos, auditoría

## Estructura del repositorio

```
ARGO/
├── ARGO-CONTEXTO.md      # Guía de contexto (IA / onboarding)
├── argo-backend/         # API Node.js + Express + MongoDB
└── argo-frontend/        # SPA Angular 19
```

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Node.js 20+, Express 4, Mongoose 8 |
| Base de datos | MongoDB |
| Autenticación | JWT |
| Frontend | Angular 19 (standalone), pnpm |
| Moneda / locale | COP, `es-CO` |

## Requisitos

- Node.js 20+
- [pnpm](https://pnpm.io)
- MongoDB en ejecución

## Desarrollo local

```bash
# Backend (terminal 1)
cd argo-backend
pnpm install
cp .env.example .env   # editar MONGO_URI, JWT_SECRET, etc.
pnpm run dev

# Frontend (terminal 2)
cd argo-frontend
pnpm install
pnpm start
```

- API: `http://localhost:3000` — health: `GET /api/health`
- App: `http://localhost:4200`

Al iniciar, el backend muestra enlaces **Local** y **Red (LAN)** con la IP de la PC servidor.

### Abrir desde otro equipo en la misma red

1. Inicie backend y frontend en la PC servidor.
2. En la consola del backend copie la URL tipo `http://192.168.x.x:3000`.
3. En el otro equipo abra: `http://192.168.x.x:4200` (misma IP, puerto 4200).

El frontend usa automáticamente el hostname del navegador para llamar al API (`argo-frontend/src/environments/environment.ts`).

**Windows:** si no carga, permita Node.js en el firewall (puertos **3000** y **4200**).

## Variables de entorno (backend)

Copie `argo-backend/.env.example` a `argo-backend/.env`:

| Variable | Descripción |
|----------|-------------|
| `PORT` | Puerto API (default 3000) |
| `MONGO_URI` | Cadena de conexión MongoDB |
| `JWT_SECRET` | Secreto para tokens |
| `JWT_EXPIRES` | Ej. `12h` |
| `UPLOAD_DIR` | Carpeta de archivos subidos |
| `PUBLIC_URL` | URL pública del API |
| `CORS_ORIGIN` | Origen permitido del frontend |

## Scripts útiles (backend)

```bash
cd argo-backend
pnpm run dev              # desarrollo con nodemon
pnpm run seed             # datos base
pnpm run seed:users
pnpm run seed:catalogos
pnpm run seed:config
```

## Roles por defecto

Al arrancar el API se inicializan roles en BD (`admin`, `cajero`, `instructor`, `recepcion`, `usuario`). Los permisos se administran en **Configuración → Roles y permisos**. Detalle en [ARGO-CONTEXTO.md](./ARGO-CONTEXTO.md#5-autenticación-y-permisos-rbac).

## Build producción (frontend)

```bash
cd argo-frontend
pnpm run build
```

Salida en `argo-frontend/dist/argo-frontend`.

## Licencia / uso

Proyecto privado de gestión operativa para CEAs. Consulte `ARGO-CONTEXTO.md` antes de cambios arquitectónicos o de permisos.
