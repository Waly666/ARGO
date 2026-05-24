# ARGO

**Software para CEAS** — gestión de alumnos, pagos, recibos y certificados.

## Estructura

- `argo-backend/` — API Node.js + Express + MongoDB
- `argo-frontend/` — Angular 19

## Requisitos

- Node.js 20+
- pnpm
- MongoDB

## Desarrollo

```bash
# Backend (terminal 1)
cd argo-backend
pnpm install
pnpm run dev

# Frontend (terminal 2)
cd argo-frontend
pnpm install
pnpm start
```

Al iniciar, el backend muestra enlaces **Local** y **Red (LAN)** con la IP de su PC.

### Abrir desde otro equipo en la misma red

1. Inicie backend y frontend en la PC servidor.
2. En la consola del backend copie la URL tipo `http://192.168.x.x:3000`.
3. En el otro equipo abra en el navegador: `http://192.168.x.x:4200` (misma IP, puerto 4200).

El frontend usa automáticamente esa IP para conectar al API.

**Windows:** si no carga, permita Node.js en el firewall (puertos 3000 y 4200).

## Variables de entorno

Copie `.env.example` a `.env` en `argo-backend` y configure MongoDB, JWT y `PUBLIC_URL`.
