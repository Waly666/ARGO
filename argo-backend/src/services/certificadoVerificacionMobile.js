/** CSS móvil para vista pública de verificación QR (misma lógica que certificado-mobile-html.ts). */

function certificadoVerificacionMobileCss(horizontal) {
  const pageW = horizontal ? 297 : 210;
  const pageH = horizontal ? 210 : 297;
  const sheetHeightVw = (pageH / pageW) * 100;
  return `
    @media screen {
      html, body {
        width: 100% !important;
        height: auto !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
        background: #525659 !important;
        -webkit-text-size-adjust: 100% !important;
        text-size-adjust: 100% !important;
      }
      .no-print { display: none !important; }
      .sheet {
        position: relative !important;
        display: block !important;
        width: 100vw !important;
        max-width: 100vw !important;
        height: ${sheetHeightVw.toFixed(4)}vw !important;
        min-height: ${sheetHeightVw.toFixed(4)}vw !important;
        margin: 0 auto !important;
        overflow: hidden !important;
        box-sizing: border-box !important;
        container-type: size !important;
      }
      .bg-fondo {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: fill !important;
        z-index: 1 !important;
        pointer-events: none !important;
      }
      .content {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        height: 100% !important;
        container-type: size !important;
        z-index: 2 !important;
      }
      .dato, .cert-id, .qr-wrap {
        box-sizing: border-box !important;
      }
      .qr-wrap img {
        display: block !important;
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
      }
    }`;
}

module.exports = { certificadoVerificacionMobileCss };
