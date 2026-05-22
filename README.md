# ARGO

Software para CEAS — gestión de alumnos, pagos, recibos y certificados.

## Estructura

- `argo-backend/` — API Node.js + Express + MongoDB
- `argo-frontend/` — Angular 19

## Requisitos

- Node.js 20+
- pnpm
- MongoDB

## Desarrollo

```bash
# Backend
cd argo-backend
pnpm install
pnpm run dev

# Frontend (otra terminal)
cd argo-frontend
pnpm install
pnpm start
```

## Variables de entorno

Copie `.env.example` a `.env` en `argo-backend` y configure MongoDB, JWT y `PUBLIC_URL`.
