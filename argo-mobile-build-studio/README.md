# ARGO Mobile Build Studio

Herramienta **local y aislada** del backend (`argo-backend`), frontend (`argo-frontend`) y del código de las apps. Sirve para editar las variables que van **embebidas en el APK** y lanzar builds EAS de las 3 apps móviles.

## Apps soportadas

| ID | Carpeta | Descripción |
|----|---------|-------------|
| `aula` | `argo-mobile-aula` | Aula Virtual |
| `cajero` | `argo-mobile-cajero` | Cajero / admin |
| `jornadas` | `argo-mobile-jornadas` | Instructores en campo |

## Qué puedes configurar

- Nombre bajo el icono del teléfono
- **Package Android** (`co.servial.aula`, etc.)
- Slug EAS, versión y `versionCode`
- **Servidor API por defecto** (`EXPO_PUBLIC_API_BASE_URL` en `eas.json`)
- Colores de splash / primario
- Nombre empresa y título (fallback en `appBranding.ts`)
- Subir logo, icono y adaptive icon (Aula)

Al **Aplicar**, el studio escribe:

- `build.profile.json` en cada app (gitignored)
- `eas.json` (URL del API)
- `app.config.ts` y `src/config/appBranding.ts`
- Copia imágenes a `assets/`

> El logo/nombre **en tiempo de ejecución** sigue viniendo del servidor (`/aula-virtual/config`, `/auth/config`). Esta herramienta configura lo que queda **fijo en el binario**.

## Uso (interfaz web)

```bash
cd argo-mobile-build-studio
pnpm install
pnpm start
```

Abre **http://127.0.0.1:3847**

### Varios clientes (marcas)

Cada cliente tiene su propio perfil guardado en `profiles/clients/<id>/` (local, no va a Git).

1. Arriba en la barra lateral elige el **cliente activo** (ej. *CEA Servial*)
2. **+ Nuevo** — crea un cliente vacío para otra marca
3. **Duplicar** — copia el cliente actual como punto de partida
4. Edita Aula / Cajero / Jornadas y **Guardar perfil** (se guarda solo para ese cliente)
5. **Aplicar + Build EAS** — compila el APK con la marca del cliente activo

> No uses **Leer del proyecto** si quieres conservar lo que escribiste: ese botón trae los valores del código fuente (que puede seguir siendo Servial).

1. Elige pestaña (Aula / Cajero / Jornadas)
2. Edita campos o sube imágenes
3. **Aplicar al código** — actualiza archivos sin compilar
4. **Aplicar + Build EAS** — aplica y lanza `eas build` (requiere `eas login`)

## Uso (CLI)

```bash
node cli.mjs apply aula
node cli.mjs apply --all
node cli.mjs build aula
node cli.mjs build --all --preview
```

## Requisitos

- Node 20+
- `pnpm` en PATH
- Sesión EAS: `pnpm dlx eas-cli login`
- Builds en la nube de Expo (cuenta `nis00227`)

## Seguridad

- El servidor solo escucha en `127.0.0.1`
- No incluir en despliegues de producción
- Perfiles en `profiles/*.json` y `uploads/` son locales
