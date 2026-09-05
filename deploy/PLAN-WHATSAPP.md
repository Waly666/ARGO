# Plan: WhatsApp Cloud API en ARGO

**Estado: no implementar todavía.** Documento de pacto para no perder el diseño.

Fecha: 2026-09-04.

Complementa el modelo de venta del producto: [GUIA-NUEVO-CLIENTE-VPS.md](./GUIA-NUEVO-CLIENTE-VPS.md), [PLAN-CLIENTE-NUEVO.md](./PLAN-CLIENTE-NUEVO.md) y la pasarela [GUIA-PASARELA-WOMPI.md](./GUIA-PASARELA-WOMPI.md).

---

## Resumen ejecutivo

| Tema | Decisión |
|------|----------|
| Canal oficial | **WhatsApp Cloud API** (Meta). No Baileys, Evolution, QR ni WhatsApp Web. |
| App del celular | Tener WhatsApp Business en el teléfono **no es** la API. No alcanza para integrar ARGO. |
| Multi-empresa | **Una config por instalación** (como Wompi y SMTP). Cada CEA usa **su** WABA, número y tarjeta de Meta. |
| Código | El mismo repo. Toggle y credenciales en `config` de **ese** Mongo / VPS. Nada de tokens en Git. |
| Fase 1 | Notificaciones de utilidad: certificado, recibo, vencimiento. |
| Fase 2 | Bot de inscripción (como el portal) + comprobante por chat + misma bandeja de consignación. |
| Liquidación | El bot **no** liquida. El humano **aprueba** el comprobante; `aprobarSolicitud` ya dispara recibo y certificado. |
| Pasarela | Servial **no** tiene Wompi. El pago del bot es **consignación manual** (QR/cuenta), igual que la web. |
| Publicidad | **No** llenar al alumno de marketing. Un hecho del ERP = un WhatsApp. |

---

## 1. Distinción que no se puede mezclar

Hay dos productos distintos de Meta:

| | WhatsApp Business (app verde) | WhatsApp Business Platform (Cloud API) |
|--|------------------------------|----------------------------------------|
| Dónde | Celular del CEA | [business.facebook.com](https://business.facebook.com) + [developers.facebook.com](https://developers.facebook.com) |
| Para qué | Chat a mano, catálogo, etiquetas | Integrar ERP, plantillas, bot, webhooks |
| ¿Sirve para ARGO? | No | Sí |
| Costo de alta | Gratis | Gratis. Se paga **por mensaje entregado** |

Casi todos los CEA ya tienen la **app**. Eso se puede dejar. La integración usa la **plataforma**.

El número del celular **no se borra** hasta decidir coexistencia / migración / número nuevo. Ver § 4.

---

## 2. Qué debe existir en Meta (por cada empresa cliente)

No se configura “un Facebook de ARGO para todos”. Cada instalación (Servial, FINSTRUVIAL, el CEA que compre el software) arma **lo suyo**.

Orden:

1. Facebook de un **admin de esa empresa**, con 2FA.
2. **Portafolio de negocio** (Business Manager) con razón social, NIT, dirección, web, correo — iguales al RUT / cámara de comercio.
3. **Verificación del negocio** (Centro de seguridad). No bloquea el número de prueba; sí hace falta para producción real.
4. Cuenta en **Meta for Developers**.
5. Una **App** con producto **WhatsApp**.
6. Una **WABA** ligada a esa app.
7. Número (prueba al inicio; el real después) con **nombre para mostrar** aprobado (el del CEA, no “Atención”).
8. **Tarjeta Visa/Mastercard** en facturación de **esa** WABA. Meta cobra a ellos, no a ARGO.
9. Token permanente de **usuario del sistema** + `PHONE_NUMBER_ID` + `WABA_ID`.
10. Webhook HTTPS del **dominio de esa instalación**, p. ej. `https://app.cliente.com.co/api/whatsapp/webhook`.
11. Plantillas de utilidad aprobadas (certificado, recibo, vencimiento).

Con el **número de prueba** de Meta y 5 celulares de test ya se puede programar. Tarjeta, verificación y número real van en paralelo, no en el primer sprint.

### 2.1 El número que ya usa el CEA

Tres caminos; se elige **antes** de tocar el celular:

1. **Coexistencia** — el mismo número sigue en la app **y** entra a la API. Personal puede contestar a mano. Recomendado si no quieren perder el chat del teléfono.
2. **Migrar solo a la API** — se sale de la app. Más limpio, más riesgo operativo.
3. **Número nuevo solo para ARGO** — el WhatsApp actual no se toca. Más fácil de probar; el cliente ve dos números del mismo CEA.

Si se desvincula mal, Meta puede dejar el número fuera de juego días o semanas.

---

## 3. Costos (qué se paga y qué no)

**Gratis:** Business Manager, app de desarrollador, WABA, Cloud API, número de prueba, envíos de prueba a los números de test.

**Se paga a Meta**, por mensaje **entregado**, según el país del destinatario. En Colombia (tarifas 2026, aprox.):

| Categoría | Uso en ARGO | Orden de magnitud |
|-----------|-------------|-------------------|
| **Utilidad** | Certificado listo, recibo, vencimiento | ~ USD 0,0008 |
| **Autenticación** | OTP (si algún día se usa) | ~ USD 0,0008 |
| **Marketing** | Vender escribiendo primero, promociones | ~ USD 0,0125 |
| **Servicio** | El cliente escribió y el bot/humano responde en 24 h | Hoy suele ser gratis; Meta empieza a cobrar ~ 1 oct 2026 (cupo ~1.000/mes por número) |

No hay cuota mensual de “activar la API”. No hace falta pauta de Facebook Ads.

Si se usa un BSP (Twilio, 360dialog, WATI) se paga Meta **más** margen. Para ARGO basta **Cloud API directo**.

Cada CEA paga **su** consumo. ARGO no centraliza la factura de WhatsApp de todos los clientes.

---

## 4. Bans y foros

En foros se mezclan dos mundos:

| | API no oficial (Baileys, Evolution, QR) | Cloud API |
|--|----------------------------------------|-----------|
| Riesgo | Alto. El número puede morir sin aviso | Bajo si se cumple política |
| Qué cae | El WhatsApp del celular | La **WABA** o el **cupo de envío**, no el Facebook personal |
| Apelación | Casi no hay | Business Support Home |

Cloud API **no** “banea Facebook porque sí”. Restringe si hay spam: bloqueos, reportes, plantilla de utilidad usada para vender, bot que escribe primero a toda la base.

Para un CEA que avisa certificado / recibo / vencimiento (un mensaje por hecho real), el riesgo es el bajo. Lo que tumba calidad:

- Masivo a `celular` **sin opt-in**.
- Meter “matricúlese en el siguiente curso” dentro del aviso de certificado.
- Bot tipo ChatGPT que responde cualquier cosa (Meta restringe asistentes genéricos; un bot de cursos / precios / inscripción sí entra).
- Bot y humano hablando a la vez en el mismo hilo.

**Prohibido en el producto:** Evolution, Baileys, whatsapp-web.js, “API con QR”.

---

## 5. Alcance pactado (qué sí y qué no)

### 5.1 Notificaciones (prioridad)

Mismo notificador que ya existe en correo (`certificadoEmail`, `reciboEmail`, aviso de vencimiento). Canal extra: WhatsApp **si** hay celular y opt-in.

| Evento | Mensaje | Tipo Meta |
|--------|---------|-----------|
| Se emite certificado | “Su certificado ya está listo” + PDF | Utilidad |
| Se genera recibo de pago | “Recibimos su pago” + PDF | Utilidad |
| Certificado por vencer | “Su certificado vence el …” (p. ej. 30 y 7 días, no diez avisos) | Utilidad |

Reglas:

- Un certificado = un WhatsApp. Un recibo = un WhatsApp.
- Si WhatsApp falla, **el correo sigue**. El negocio no depende del chat.
- **No** adjuntar oferta comercial en el mismo mensaje.
- Idempotente: un job reintentado no manda el certificado tres veces.

### 5.2 Bot de ventas = inscripción, no matrícula

El bot **cierra la venta comercial** (eligió curso, dejó datos, mandó comprobante). **No liquida.**

Igual que la página:

1. Inscribirse **no** es matricularse.
2. Entra a **alumnos** con origen `WHATSAPP` (hoy solo hay `SISTEMA` y `WEB`).
3. Aún no está matriculado.
4. Paga por consignación (Servial no tiene pasarela).
5. Envía el comprobante (en la web: upload; en WhatsApp: foto en el chat).
6. Un humano verifica en la **misma** bandeja de consignación.
7. Al **aprobar**, se dispara lo que ya está: ingreso, recibo, certificado (si aplica), y luego las notificaciones de § 5.1 (correo + WhatsApp).

Catálogo y precios: **programas y tarifas del ERP en vivo** (`tarifa1`, `tarifaVirtual`, `valorTarifaServicio`). No listas fijas en el bot. No las páginas de marketing de FINSTRUVIAL como SKU de venta.

El bot **no** resuelve descuentos raros, combos, tarifa gestor/empresa ni “pague la mitad”. Eso es operador.

### 5.3 Bandeja de pagos: no duplicar

Ya existe `solicitudesPagoConsignacion` y la pantalla de aprobar/rechazar.

No crear un módulo “pagos WhatsApp” aparte. Agregar **clasificación**:

- `canal: portal` — lo de la página (`ORIGEN_PAGO_CONSIGNACION` = `portal_consignacion_qr`).
- `canal: whatsapp` — lo del bot.

Misma lista, mismo `aprobarSolicitud` / `rechazarSolicitud`, un filtro o pestaña. Guardar además teléfono y `messageId` de Meta para trazabilidad.

Mientras el pago está **en revisión**, el bot no sigue vendiendo en ese hilo: “Recibimos su comprobante; le avisamos al verificarlo.” Si escriben “asesor”, pasa a persona.

### 5.4 Fuera de alcance (de momento)

- Wompi / link de pago en el bot (cuando un cliente tenga pasarela, se podrá añadir; Servial no).
- Bot que matricule o cree el ingreso solo.
- Chatwoot u otro inbox de terceros.
- Bandeja completa de chats en ARGO (el humano usa coexistencia o la bandeja de consignación).
- Marketing masivo, plantillas de promoción, escribir primero a la base.
- Una WABA de ARGO hablando en nombre de todos los CEA.

---

## 6. Flujo del bot (calca del portal)

```
Cliente escribe al WhatsApp del CEA
        ↓
Webhook Meta → ARGO (esta instalación)
        ↓
Menú: programas activos + precio real
        ↓
Datos (cédula, nombre, celular, correo)
        ↓
Crea o reutiliza alumno, origen WHATSAPP (no matriculado)
        ↓
Bot manda cuenta/QR (config de consignación ya existente)
        ↓
Cliente manda foto del comprobante
        ↓
SolicitudPagoConsignacion (canal: whatsapp, estado pendiente)
        ↓
Humano filtra “WhatsApp”, aprueba o rechaza
        ↓
Aprobar → mismo pipeline de hoy (ingreso, recibo, certificado)
        ↓
Notificador → correo + WhatsApp
```

**Un chat, un dueño:** o habla el bot o habla el humano, nunca los dos.

Pasa a humano cuando: escribe “asesor” / “persona”; el curso no se puede vender por menú; pago raro / reclamo / alumno con deuda; 2–3 fallos seguidos (cédula, opción).

---

## 7. Arquitectura (para no ensuciar el ERP)

Tres piezas. El mismo adaptador sirve notificaciones y bot.

```
ARGO (eventos de negocio)
    → Notificador (correo | WhatsApp)
        → Adaptador Cloud API (credenciales de ESTA instalación)

WhatsApp inbound
    → Webhook de ESTE VPS
        → Motor de conversación (estado en Mongo)
            → casos de uso ya existentes (alumno, consignación)
            → o silencio si hay humano / pago en revisión
```

- **No** llamar a Meta desde `certificadoController` ni desde cada módulo.
- Estado del chat en Mongo (`telefono`, `paso`, `idPrograma`, `alumnoId`, `asignadoA`). Si cae Node, no se pierde la inscripción a medias.
- El bot usa mensajes de **sesión** (el cliente escribió primero → ventana 24 h). No escribe primero a la base.
- Media del comprobante: bajar de Meta, guardar como hoy el upload de consignación (`urlComprobante`).

Piezas de código a reutilizar (no reescribir):

| Existente | Rol |
|-----------|-----|
| `certificadoEmail` / `reciboEmail` | Eventos a los que se suma WhatsApp |
| `SolicitudPagoConsignacion` + `pagoConsignacionPortal.aprobarSolicitud` | Verificar pago y liquidar |
| `configPagoConsignacion` | Cuentas y QR que el bot reenvía |
| `origenAlumno` (`SISTEMA`, `WEB`) | Añadir `WHATSAPP` |
| `pasarela_wompi` en `config` | Molde de pantalla + secretos por instalación |
| `envioCorreosAlumno` | Molde de toggles (certificados / comprobantes) |

`empresaId` del alumno es la empresa que **trae** alumnos (transporte, etc.). **No** es el cliente que compró ARGO. El tenant de WhatsApp es la **instalación** (ese VPS / esa base).

---

## 8. Multi-empresa: cómo se configura

ARGO se vende **un repo, N instalaciones** (carpeta + `.env` + Mongo + dominios). WhatsApp sigue **Wompi y SMTP**:

| Elemento | ¿Compartido entre clientes? |
|----------|-----------------------------|
| Código del conector y del bot | Sí |
| WABA / número / token / plantillas | **No** — de cada CEA |
| Factura de Meta | **No** — tarjeta de cada CEA |
| Webhook | **No** — URL del dominio de ese cliente |
| Toggle WhatsApp on/off | Por instalación, **apagado por defecto** |

Pantalla **Configuración → WhatsApp** (clave de `config` tipo `whatsapp_cloud`):

| Campo | Notas |
|--------|--------|
| Activar WhatsApp | Off por defecto |
| Activar bot de inscripción | Otro toggle; no todos lo compran el día 1 |
| Phone number ID | De **su** WABA |
| WABA ID | |
| Token usuario del sistema | Enmascarar al mostrar, como Wompi |
| Webhook verify token | Lo genera esa instalación |
| Nombres de plantillas | certificado, recibo, vencimiento |

Webhook de ejemplo:

- Servial: `https://app.servial…/api/whatsapp/webhook`
- Otro CEA: `https://app.acme.edu.co/api/whatsapp/webhook`

Si un cliente no configura WhatsApp, ARGO sigue: correo sí, chat no.

**No** usar una WABA “de ARGO” mandando como Servial y como FINSTRUVIAL. Meta lo trata como nombre engañoso y cae calidad.

**Tech Provider + Embedded Signup** (una app de ARGO y muchas WABA) solo tendría sentido si un día todo correra en un SaaS con un solo backend. Con el modelo actual (**un VPS por cliente**) no hace falta y el webhook se vuelve un lío.

Onboarding de cliente nuevo (junto a SMTP y Wompi): ellos crean su Business Manager, pegan IDs/token en Configuración, Meta cobra a su tarjeta, soporte solo verifica un mensaje de prueba.

---

## 9. Opt-in y datos (Colombia)

Aunque los avisos sean de utilidad, Meta pide **opt-in** para escribir primero (plantillas).

- Casilla en matrícula / portal / bot: acepta avisos de certificado, pagos y vencimiento por WhatsApp.
- El texto actual de habeas data de ARGO dice uso administrativo/informativo y **no comercial**. El bot de **venta** exige autorización de canal WhatsApp explícita; los avisos transaccionales caben mejor como informativos, pero hay que registrar el sí y respetar STOP.
- Celular en formato usable (E.164 `+57…`). Sin celular o sin opt-in → solo correo.

---

## 10. Orden de implementación (cuando se retome)

No empezar por el bot de ventas.

1. **Adaptador Cloud API** genérico + pantalla Configuración → WhatsApp (vacía / off).
2. Probar envío con **número de prueba** de Meta en **una** instalación (p. ej. Servial).
3. **Notificador:** certificado, recibo, vencimiento → correo y WhatsApp.
4. Origen alumno `WHATSAPP` + `canal` en consignación + filtro en la bandeja existente.
5. Bot de menú: catálogo → inscripción → QR → foto → solicitud `canal: whatsapp`.
6. Número real del CEA (coexistencia o el camino que elijan) + plantillas aprobadas + tarjeta.

Fuera del día 1: pasarela en el bot, bandeja de chat tipo inbox, coexistencia obligatoria, verificación de negocio de Meta.

**Mínimo para codear:** app de prueba en Developers **o** mock del adaptador. El WhatsApp del celular del CEA no se toca en el primer sprint.

---

## 11. Qué debe entregar cada CEA (checklist)

- [ ] Admin de Business Manager (o agregar al implementador).
- [ ] App Developers + WABA + número de prueba.
- [ ] Decisión del número real: coexistencia / migrar / número nuevo.
- [ ] Razón social, NIT, web, PDF RUT o cámara de comercio (verificación).
- [ ] Nombre para mostrar = nombre del CEA.
- [ ] Tarjeta en facturación de **su** WABA (producción).
- [ ] `WABA_ID`, `PHONE_NUMBER_ID`, token permanente.
- [ ] Textos de las 3 plantillas de utilidad.
- [ ] Quién aprueba consignaciones (el mismo rol de hoy).

---

## 12. Qué no se pactó (queda abierto)

- Textos finales de plantillas por marca.
- Plazo exacto del aviso de vencimiento (30/7 días u otra regla ya configurada en aula virtual).
- Si el bot, en clientes **con** Wompi, ofrecerá también pago en línea más adelante.
- Bandeja de chats en el ERP vs. solo coexistencia en el teléfono.
- Cambio del texto legal de tratamiento de datos para canal WhatsApp.

Cuando se implemente, este archivo deja de ser solo pacto: actualizar **Estado** y, si aplica, extraer una guía de operación al estilo de `GUIA-PASARELA-WOMPI.md`.
