/**
 * Arranque antes de curso-app.js:
 * - Clases táctiles del curso
 * - TTS nativo vía React Native (speechSynthesis en WebView Android no habla)
 * - Bloqueo de Edge TTS (CDN) para forzar voz local → puente nativo
 */
export const COURSE_PLAYER_EARLY_BOOT = `
(function () {
  if (window.__servialRnEarlyBoot) return;
  window.__servialRnEarlyBoot = true;

  var html = document.documentElement;
  html.classList.add('is-touch', 'is-android', 'servial-rn-app');
  window.__servialRnPlayer = true;

  var vp = document.querySelector('meta[name="viewport"]');
  if (!vp) {
    vp = document.createElement('meta');
    vp.setAttribute('name', 'viewport');
    document.head.appendChild(vp);
  }
  vp.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover');

  if (window.ReactNativeWebView && !window.__servialScrollIntoViewPatch) {
    window.__servialScrollIntoViewPatch = true;
    var origScrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = function (opts) {
      // En la app móvil el scroll lo maneja React Native; no seguir al asistente.
      if (window.__servialRnPlayer) return;
      return origScrollIntoView.call(this, opts);
    };
  }

  try {
    localStorage.setItem('servial-voice-assistant-voice', 'local:es-CO-GonzaloNeural-local');
  } catch (_e) {}

  if (window.ReactNativeWebView) {
    var origAppend = Element.prototype.appendChild;
    Element.prototype.appendChild = function (node) {
      if (node && node.tagName === 'SCRIPT') {
        var src = String(node.src || '');
        if (src.indexOf('edge-tts') !== -1) {
          window.setTimeout(function () {
            try { node.dispatchEvent(new Event('error')); } catch (_e2) {}
          }, 0);
          return node;
        }
      }
      return origAppend.call(this, node);
    };
  }

  if (!window.ReactNativeWebView) return;

  window.__servialSpeechPolyfill = true;

  var pending = {};
  var utterSeq = 0;
  var activeId = 0;

  function NativeUtterance(text) {
    this.text = String(text || '');
    this.lang = 'es-CO';
    this.rate = 1;
    this.pitch = 1;
    this.volume = 1;
    this.onstart = null;
    this.onend = null;
    this.onerror = null;
  }
  window.SpeechSynthesisUtterance = NativeUtterance;

  var fakeVoice = {
    name: 'Gonzalo',
    voiceURI: 'es-CO-GonzaloNeural-local',
    lang: 'es-CO',
    localService: true,
    default: true,
  };

  function finishUtterance(id, isError) {
    if (activeId !== id) return;
    activeId = 0;
    window.speechSynthesis.speaking = false;
    var utter = pending[id];
    delete pending[id];
    if (!utter) return;
    if (isError) {
      if (typeof utter.onerror === 'function') utter.onerror();
    } else if (typeof utter.onend === 'function') {
      utter.onend();
    }
  }

  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data || data.type !== 'SERVIAL_TTS_END') return;
    finishUtterance(data.id, !!data.error);
  });

  window.speechSynthesis = {
    speaking: false,
    pending: false,
    paused: false,
    getVoices: function () {
      return [fakeVoice];
    },
    speak: function (utterance) {
      if (!utterance) return;
      var text = String(utterance.text || '').replace(/\\s+/g, ' ').trim();
      if (!text || text.length < 2) {
        window.setTimeout(function () {
          if (typeof utterance.onend === 'function') utterance.onend();
        }, 0);
        return;
      }
      var id = ++utterSeq;
      activeId = id;
      pending[id] = utterance;
      window.speechSynthesis.speaking = true;
      window.setTimeout(function () {
        if (typeof utterance.onstart === 'function') utterance.onstart();
      }, 0);
      window.ReactNativeWebView.postMessage(
        JSON.stringify({
          type: 'SERVIAL_TTS',
          id: id,
          text: text,
          lang: utterance.lang || 'es-CO',
          rate: utterance.rate || 1,
        }),
      );
    },
    cancel: function () {
      activeId = 0;
      pending = {};
      window.speechSynthesis.speaking = false;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SERVIAL_TTS_CANCEL' }));
    },
    pause: function () {
      window.speechSynthesis.paused = true;
    },
    resume: function () {
      window.speechSynthesis.paused = false;
    },
    addEventListener: function () {},
    removeEventListener: function () {},
  };

  if (!window.__servialModalObserver) {
    window.__servialModalObserver = true;
    function notifyModalClose() {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SERVIAL_MODAL_CLOSE' }));
      } catch (_e4) {}
    }
    function servialBindModalTap(el, handler) {
      if (!el || el.dataset.servialTapBound) return;
      el.dataset.servialTapBound = '1';
      var run = function (ev) {
        ev.preventDefault();
        ev.stopPropagation();
        handler(ev);
      };
      el.addEventListener('touchend', run, { passive: false });
      el.addEventListener('click', run);
    }
    function patchResultModal(modal) {
      if (!modal || modal.dataset.servialPatched) return;
      modal.dataset.servialPatched = '1';

      document.documentElement.classList.remove('servial-modal-open');
      modal.style.setProperty('pointer-events', 'none', 'important');
      modal.style.setProperty('z-index', '99999', 'important');

      var card = modal.querySelector('.result-card');
      if (card) {
        card.style.setProperty('pointer-events', 'auto', 'important');
        card.style.setProperty('position', 'relative', 'important');
        card.style.setProperty('z-index', '2', 'important');
        card.style.setProperty('transform', 'translateZ(0)', 'important');
      }

      modal.querySelectorAll('.result-effect, .jackpot-reels, .slot-banner, .slot-mini-popup').forEach(function (el) {
        el.style.setProperty('pointer-events', 'none', 'important');
      });

      document.querySelectorAll('body > .slot-banner, body > .slot-mini-popup').forEach(function (el) {
        el.style.setProperty('pointer-events', 'none', 'important');
        el.style.setProperty('z-index', '1', 'important');
      });

      modal.querySelectorAll('a.nav-btn[href], .result-actions a[href]').forEach(function (link) {
        servialBindModalTap(link, function () {
          var href = link.getAttribute('href');
          if (!href || href.charAt(0) === '#') return;
          notifyModalClose();
          window.location.assign(href);
        });
      });

      modal.querySelectorAll('button.nav-btn, [data-close], [data-restart-class]').forEach(function (btn) {
        if (btn.dataset.servialTapBound) return;
        btn.dataset.servialTapBound = '1';
        btn.addEventListener('touchend', function (ev) {
          ev.preventDefault();
          ev.stopPropagation();
          if (btn.hasAttribute('data-close')) {
            notifyModalClose();
          }
          btn.click();
        }, { passive: false });
      });

      window.setTimeout(function () {
        var fx = modal.querySelector('.result-effect');
        if (fx) fx.style.opacity = '0.35';
        modal.querySelectorAll('.score-number').forEach(function (el) {
          el.style.animation = 'none';
        });
      }, 4500);
    }
    new MutationObserver(function () {
      var modal = document.querySelector('.result-modal');
      if (!modal) {
        document.documentElement.classList.remove('servial-modal-open');
        return;
      }
      if (!window.ReactNativeWebView) return;
      patchResultModal(modal);
      if (modal.dataset.servialModalNotified) return;
      modal.dataset.servialModalNotified = '1';
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SERVIAL_MODAL_OPEN' }));
      } catch (_e3) {}
    }).observe(document.documentElement, { childList: true, subtree: true });
  }

  (function pollServialMobileHooks() {
    if (!window.__servialRnPlayer) return;

    function servialRevealTypewriterTargets() {
      var selector =
        '.hero-card h1, .hero-card .lead, .grid .card h2, .grid .card h3, .activity-header h2, .wheel-panel h2, .final-panel h2, .report-section h2, .report-section h3, .report-section .expanded-note h3, .critical-card h3, .strategy-card h3';
      document.querySelectorAll(selector).forEach(function (el) {
        if (typeof rememberTypewriterText === 'function') rememberTypewriterText(el);
        var text = el.dataset.typewriterText || el.getAttribute('aria-label') || el.textContent;
        text = String(text || '').replace(/\\s+/g, ' ').trim();
        if (text) {
          el.textContent = text;
          el.dataset.typewriterText = text;
        }
        el.classList.remove('typewriter-waiting', 'typewriter-active');
        el.classList.add('typewriter-done');
        el.dataset.typed = '1';
        el.removeAttribute('aria-label');
        el.querySelectorAll('.typewriter-cursor').forEach(function (node) { node.remove(); });
      });
    }
    window.servialRevealTypewriterTargets = servialRevealTypewriterTargets;

    if (!window.__servialMobileHooks && typeof initTypewriter === 'function') {
      window.__servialMobileHooks = true;
      initTypewriter = function () { servialRevealTypewriterTargets(); };
      if (typeof typewriteElement === 'function') {
        typewriteElement = function (el) {
          if (el && typeof rememberTypewriterText === 'function') rememberTypewriterText(el);
          if (el && el.dataset.typewriterText) el.textContent = el.dataset.typewriterText;
          if (el) { el.classList.add('typewriter-done'); el.dataset.typed = '1'; }
          return Promise.resolve();
        };
      }
      if (typeof queueTypewriter === 'function') {
        queueTypewriter = function (el) {
          if (el && typeof rememberTypewriterText === 'function') rememberTypewriterText(el);
          if (el && el.dataset.typewriterText) el.textContent = el.dataset.typewriterText;
          if (el) { el.classList.add('typewriter-done'); el.dataset.typed = '1'; }
        };
      }
      if (typeof highlightNarrationAnchor === 'function') highlightNarrationAnchor = function () {};
      if (typeof highlightVoiceCard === 'function') highlightVoiceCard = function () {};
      if (typeof moveAssistantNearCard === 'function') moveAssistantNearCard = function () {};
      if (typeof scrollToNarrationItem === 'function') scrollToNarrationItem = function () {};
      if (typeof initCardAnimations === 'function') {
        initCardAnimations = function () {
          document.querySelectorAll('.card-animate').forEach(function (card) {
            card.classList.add('card-visible');
          });
        };
      }
      servialRevealTypewriterTargets();
    }

    if (!window.__servialAssistantBridge && typeof startContinuousNarration === 'function' && typeof setVoiceAssistantEnabled === 'function') {
      window.__servialAssistantBridge = true;
      var continuousKey = 'educarte-voice-continuous-reading';
      var origStart = startContinuousNarration;
      startContinuousNarration = function () {
        var continuing = sessionStorage.getItem(continuousKey) === '1';
        if (!continuing && !window.__servialUserActivatedAssistant) return;
        return origStart.apply(this, arguments);
      };
      var origSet = setVoiceAssistantEnabled;
      setVoiceAssistantEnabled = function (enabled) {
        if (enabled) window.__servialUserActivatedAssistant = true;
        return origSet.apply(this, arguments);
      };
      if (typeof scheduleVoiceNarrationCheck === 'function') scheduleVoiceNarrationCheck = function () {};
      if (typeof speakCard === 'function') {
        var origSpeakCard = speakCard;
        speakCard = function (card, opts) {
          if (!window.__servialUserActivatedAssistant) return;
          return origSpeakCard.apply(this, arguments);
        };
      }
      if (typeof speakNarrationQueueItem === 'function') {
        var origSpeakItem = speakNarrationQueueItem;
        speakNarrationQueueItem = function (index) {
          if (!window.__servialUserActivatedAssistant) return;
          return origSpeakItem.apply(this, arguments);
        };
      }
      if (typeof stopVoiceNarration === 'function' && localStorage.getItem('educarte-voice-assistant-enabled') === '1') {
        var continuing = sessionStorage.getItem(continuousKey) === '1';
        if (!continuing) {
          window.setTimeout(function () { try { stopVoiceNarration(); } catch (_e5) {} }, 0);
        }
      }
    }

    if (!window.__servialMobileHooks || !window.__servialAssistantBridge) {
      window.setTimeout(pollServialMobileHooks, 40);
      return;
    }
  })();
})();
true;
`;

/** Puente progreso ARGO → React Native WebView. */
export const COURSE_PLAYER_RN_BRIDGE = `
(function () {
  function notifyRn(data) {
    try {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    } catch (_e) {}
  }
  function patch() {
    if (!window.ARGO || window.__argoRnPatched) return;
    window.__argoRnPatched = true;
    var orig = window.ARGO.reportProgress.bind(window.ARGO);
    window.ARGO.reportProgress = function (body) {
      return orig(body).then(function (res) {
        notifyRn({
          type: 'ARGO_PROGRESO_ACTUALIZADO',
          idPrograma: window.__argoCourseConfig && window.__argoCourseConfig.idPrograma,
        });
        return res;
      });
    };
  }
  patch();
  var tries = 0;
  var timer = setInterval(function () {
    patch();
    tries += 1;
    if (tries > 30) clearInterval(timer);
  }, 500);
})();
true;
`;

export function buildCoursePlayerInitScript(payload: object, sync: object): string {
  return `
    (function () {
      var a = ${JSON.stringify(payload)};
      var b = ${JSON.stringify(sync)};
      window.dispatchEvent(new MessageEvent('message', { data: a }));
      window.dispatchEvent(new MessageEvent('message', { data: b }));
    })();
    true;
  `;
}

/** Scroll nativo del WebView + modal de evaluación clicable. */
export const COURSE_PLAYER_SCROLL_FIX = `
(function () {
  var style = document.getElementById('servial-rn-scroll');
  if (!style) {
    style = document.createElement('style');
    style.id = 'servial-rn-scroll';
    (document.head || document.documentElement).appendChild(style);
  }
  style.textContent =
    'html.servial-rn-app,html.servial-rn-app body{height:auto!important;min-height:100%!important;max-height:none!important;overflow-x:hidden!important;overscroll-behavior-y:auto!important;-webkit-overflow-scrolling:touch!important;}' +
    'html.servial-rn-app body.mobile-nav-open{overflow:hidden!important;}' +
    'html.servial-rn-app .app-shell{height:auto!important;min-height:100vh!important;max-height:none!important;overflow:visible!important;}' +
    'html.servial-rn-app .container{overflow:visible!important;}' +
    'html.servial-rn-app .voice-assistant{pointer-events:none!important;}' +
    'html.servial-rn-app .voice-assistant-mascot,html.servial-rn-app .voice-assistant-voice-btn,html.servial-rn-app .voice-assistant-menu,html.servial-rn-app .voice-assistant-bubble{pointer-events:auto!important;touch-action:manipulation!important;}' +
    'html.servial-rn-app .result-modal{position:fixed!important;inset:0!important;z-index:99999!important;display:flex!important;align-items:center!important;justify-content:center!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;pointer-events:none!important;backdrop-filter:none!important;}' +
    'html.servial-rn-app .result-modal .result-card{width:min(calc(100% - 28px),540px)!important;max-height:calc(100dvh - 32px)!important;overflow-y:auto!important;pointer-events:auto!important;position:relative!important;z-index:2!important;transform:translateZ(0)!important;margin:auto!important;}' +
    'html.servial-rn-app .result-modal .result-effect,html.servial-rn-app .result-modal .jackpot-reels,html.servial-rn-app .slot-banner,html.servial-rn-app .slot-mini-popup{pointer-events:none!important;}' +
    'html.servial-rn-app .result-modal .result-actions,html.servial-rn-app .result-modal .nav-btn,html.servial-rn-app .result-modal a,html.servial-rn-app .result-modal button{pointer-events:auto!important;touch-action:manipulation!important;min-height:48px!important;}' +
    'html.servial-rn-app .result-card.passed .result-effect span{animation-iteration-count:4!important;}' +
    'html.servial-rn-app .typewriter-waiting,html.servial-rn-app .typewriter-active{min-height:unset!important;opacity:1!important;}' +
    'html.servial-rn-app .typewriter-cursor{display:none!important;}';

  function unlockScroll() {
    if (!document.body) return;
    if (document.body.classList.contains('mobile-nav-open')) return;
    if (document.querySelector('.result-modal')) return;
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('height');
    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('height');
  }

  unlockScroll();
  window.addEventListener('load', unlockScroll, { once: true });
  if (!window.__servialOverflowGuard) {
    window.__servialOverflowGuard = true;
    window.setInterval(unlockScroll, 800);
  }
})();
true;
`;

/** Restaura textos del curso sin efecto máquina de escribir (app móvil). */
export const COURSE_PLAYER_REVEAL_TYPEWRITER = `
(function () {
  if (typeof window.servialRevealTypewriterTargets === 'function') {
    window.servialRevealTypewriterTargets();
  }
})();
true;
`;

/** Hooks móvil: sin typewriter ni narración automática por tarjetas. */
export const COURSE_PLAYER_MOBILE_HOOKS = `
(function installServialMobileHooks() {
  if (!window.__servialRnPlayer) return;
  if (typeof window.servialRevealTypewriterTargets === 'function') {
    window.servialRevealTypewriterTargets();
  }
  if (!window.__servialMobileHooks || !window.__servialAssistantBridge) {
    window.setTimeout(installServialMobileHooks, 120);
  }
})();
true;
`;

/** @deprecated Usar COURSE_PLAYER_MOBILE_HOOKS */
export const COURSE_PLAYER_ASSISTANT_BRIDGE = COURSE_PLAYER_MOBILE_HOOKS;

export function buildCoursePlayerBridgeScript(apiBaseUrl: string): string {
  const bridgeUrl = `${apiBaseUrl.replace(/\/+$/, '')}/aula-virtual/argo-bridge.js`;
  return `
(function () {
  if (window.ARGO || document.querySelector('script[data-argo-bridge]')) return;
  var script = document.createElement('script');
  script.src = ${JSON.stringify(bridgeUrl)};
  script.async = true;
  script.dataset.argoBridge = 'true';
  document.head.appendChild(script);
})();
true;
`;
}

/** Reporta altura del HTML al ScrollView padre (Android). */
export const COURSE_PLAYER_HEIGHT_REPORT = `
(function () {
  if (window.__servialHeightReport) return;
  window.__servialHeightReport = true;
  var lastHeight = 0;
  var timer = 0;
  function measure() {
    return Math.max(
      document.documentElement.scrollHeight || 0,
      document.body ? document.body.scrollHeight : 0,
      document.documentElement.offsetHeight || 0,
      window.innerHeight || 0
    );
  }
  function report() {
    if (!window.ReactNativeWebView) return;
    if (timer) window.clearTimeout(timer);
    timer = window.setTimeout(function () {
      timer = 0;
      var h = measure();
      if (h <= lastHeight) return;
      lastHeight = h;
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'SERVIAL_PAGE_HEIGHT', height: h }));
    }, 100);
  }
  report();
  window.setTimeout(report, 300);
  window.setTimeout(report, 900);
  window.addEventListener('load', report, { once: true });
  if (typeof ResizeObserver !== 'undefined' && document.body) {
    new ResizeObserver(report).observe(document.body);
  }
})();
true;
`;
