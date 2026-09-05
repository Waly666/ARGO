# ARGO SEO Studio

Herramienta **local y aislada** para generar títulos, meta descripciones y keywords del **portal aula virtual** por cliente. Complementa el panel **SEO (Google)** del ERP: aquí diseñas el pack; en el ERP lo importas.

## ¿Para qué sirve?

1. Creas un **perfil por cliente** (Servial, Finstruvial, etc.)
2. Indicas **marca, ciudad, dominio** y los **servicios que más presta**
3. La app genera SEO **alineado con las páginas del portal** (`/`, `/cursos`, `/cursos-conduccion`, `/servicios`, etc.)
4. Exportas JSON compatible con `site.seo` y `landing.metaDescription` del ERP

## Uso

```bash
cd argo-seo-studio
pnpm install   # o npm install
pnpm start
```

Abre **http://127.0.0.1:3848**

### Flujo recomendado

1. **+ Nuevo** cliente. Si el nombre incluye **Servial**, se carga el perfil CEA (licencias, cursos no formales, aula virtual, trámites). Si incluye **Finstruvial**, el portafolio de consultoría.
2. Complete dominio y, si hace falta, ajuste servicios
3. **Generar SEO**
4. **Copiar JSON ERP** → en el ERP: **Aula virtual → Editor del sitio → Diseño → SEO (Google) → Importar pack JSON**
5. **Publicar** cambios en el editor del sitio

## Servial Colombia

El tono no es el de FINSTRUVIAL (PERIDATA, INFRAVIAL). Enfatiza:

- **Licencias de conducción** A2 (moto), B1 (particular), C1–C3 (público y carga)
- **Clases prácticas** en carros y motos, instructores habilitados
- **Cursos no formales:** manejo defensivo, primeros auxilios, normas de tránsito, curso obligatorio de mercancías peligrosas, extintores e incendios, mecánica básica
- **Aula virtual**
- **Asesoría en trámites** de tránsito
- Institución **seria y confiable** en Villavicencio, Meta

Las rutas `/servicios/*` son las mismas del portal; los textos del pack dicen «Asesoría en tránsito», «Capacitación», «Consultoría», no PERIDATA.

## Servicios del catálogo

Agrupados en: CEA y licencias, cursos no formales, aula virtual, asesoría y trámites, empresas y jornadas, portafolio institucional (Servial o Finstruvial).

Puede añadir **servicios personalizados** con keywords propias.

## Export ERP

El JSON exportado tiene esta forma:

```json
{
  "site": {
    "seo": {
      "home": { "titulo": "...", "descripcion": "...", "keywords": "..." },
      "cursos": { ... }
    }
  },
  "landing": {
    "metaDescription": "...",
    "metaKeywords": "..."
  }
}
```

## Relación con otros proyectos

| Herramienta | Puerto | Función |
|-------------|--------|---------|
| **argo-mobile-build-studio** | 3847 | APK móvil por cliente |
| **argo-seo-studio** | 3848 | SEO portal por cliente |
| **ERP → Editor del sitio → SEO** | — | Importar JSON y publicar en producción |

## Seguridad

- Solo escucha en `127.0.0.1`
- Perfiles en `profiles/clients/` (local, gitignored)
- No desplegar a producción
