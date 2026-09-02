# ARGO SEO Studio

Herramienta **local y aislada** para generar títulos, meta descripciones y keywords del **portal aula virtual** por cliente. Complementa el panel **SEO (Google)** del ERP: aquí diseñas el pack; en el ERP lo pegas o transcribes.

## ¿Para qué sirve?

1. Creas un **perfil por cliente** (Finstruvial, Servial, etc.)
2. Indicas **marca, ciudad, dominio** y los **servicios que más presta**
3. La app genera SEO **alineado con las páginas del portal** (`/`, `/cursos`, `/mercancias-peligrosas`, etc.)
4. Exportas JSON compatible con `site.seo` y `landing.metaDescription` del ERP

## Uso

```bash
cd argo-seo-studio
pnpm install   # o npm install
pnpm start
```

Abre **http://127.0.0.1:3848**

### Flujo recomendado

1. **+ Nuevo** cliente (o duplicar uno existente)
2. Complete datos de empresa y marque servicios
3. **Generar SEO**
4. **Copiar JSON ERP** → en el ERP: **Aula virtual → Editor del sitio → Diseño → SEO (Google) → Importar pack JSON**
5. **Publicar** cambios en el editor del sitio

## Servicios del catálogo

Incluye plantillas para: seguridad vial, manejo defensivo, capacitación conductores, cursos virtuales, licencias, examen teórico, transporte, mercancías peligrosas, trabajo en alturas, jornadas, certificados, COVE y **portafolio FINSTRUVIAL** (`/servicios`, PERIDATA, INFRAVIAL, planeación vial, etc.).

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

## Próximos pasos (ideas)

- Importar pack JSON directo al ERP vía API (requiere auth)
- ~~Botón «Aplicar al editor» si el ERP corre en local~~ (importar pack JSON en el panel SEO)
- Plantillas por sector (CEA, fundación, solo virtual)
