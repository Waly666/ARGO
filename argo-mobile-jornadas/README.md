# ARGO Mobile Jornadas

App móvil (Expo) para **instructores** que operan capacitaciones en campo (carpa): clases, asistencias, evidencia fotográfica y certificados según el contrato.

La **planificación** (contratos, generar jornadas, configuración) sigue en el frontend web (`argo-frontend` → Jornadas).

## Requisitos

- Node 20+
- pnpm
- Backend ARGO en marcha (`argo-backend`)
- Usuario con permiso **`jornadas.operar`** (o `jornadas.gestionar`)

## Instalación

```powershell
cd argo-mobile-jornadas
pnpm install
pnpm start
```

Escanea el QR con **Expo Go** o ejecuta:

```powershell
pnpm android
```

## Servidor API

En login indique la IP de la PC con el backend, por ejemplo:

- LAN: `192.168.1.50:3000`
- Producción: `https://infravial.cloud`

La app normaliza a `…/api`.

Variable opcional en `.env`:

```
EXPO_PUBLIC_API_BASE_URL=http://192.168.1.50:3000/api
```

## Flujo instructor

1. **Inicio** → Jornadas de hoy  
2. Elegir jornada **EN PROCESO**  
3. Listar / crear clases  
4. **Operar clase**: programa, ubicación, horario, foto, iniciar/finalizar  
5. **Asistencia**: documento → progreso certificación → marcar asistencia  
6. **Certificados**: listado y vista HTML

## Build APK

```powershell
pnpm build:apk
```

## Estructura

| Carpeta | Descripción |
|---------|-------------|
| `src/api/` | Cliente HTTP + endpoints `/jornadas/*` |
| `src/screens/` | Login, home, jornadas, clases, certificados |
| `src/context/` | Autenticación |

## Notas

- Misma API que la web (`jornada-instructor`).
- Certificados automáticos respetan `tipoCertificado`, `numSesCert`, etc. del contrato.
- Firewall Windows: permitir puerto **3000** en la red local.
