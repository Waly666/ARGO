/**
 * Puente ARGO Aula Virtual — inyectado automáticamente en cada HTML del curso.
 */
(function () {
  'use strict';

  var config = null;

  function num(v) {
    var n = Number(v);
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
  }

  function setConfig(data) {
    if (!data || !data.apiUrl || !data.token || !data.idPrograma) return;
    config = {
      apiUrl: String(data.apiUrl).replace(/\/+$/, ''),
      token: String(data.token),
      idPrograma: String(data.idPrograma),
    };
  }

  function onPortalMessage(ev) {
    if (!ev.data) return;
    if (ev.data.type === 'ARGO_INIT') {
      setConfig(ev.data);
      if (window.__argoAutoSync) window.__argoAutoSync.kick(true);
    }
    if (ev.data.type === 'ARGO_SYNC_REQUEST' && window.__argoAutoSync) {
      window.__argoAutoSync.kick(true);
    }
  }

  window.addEventListener('message', onPortalMessage);

  function notifyParent(data) {
    if (!config) return;
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(
          {
            type: 'ARGO_PROGRESO_ACTUALIZADO',
            idPrograma: config.idPrograma,
            progreso: data.progreso,
            reglas: data.reglas,
            certificado: data.certificado,
            aviso: data.aviso,
          },
          '*',
        );
      }
    } catch (_e) {
      /* ignore */
    }
  }

  function reportProgress(body) {
    if (!config) {
      return Promise.resolve({ ok: false, motivo: 'sin_config' });
    }
    var url =
      config.apiUrl +
      '/cursos/' +
      encodeURIComponent(config.idPrograma) +
      '/progreso';
    return fetch(url, {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + config.token,
      },
      body: JSON.stringify(body || {}),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error((data && data.message) || 'Error al reportar progreso');
          notifyParent(data);
          return data;
        });
      })
      .catch(function (e) {
        console.error('[ARGO] reportProgress:', e.message || e);
        throw e;
      });
  }

  window.ARGO = {
    ready: function () {
      return !!config;
    },
    reportProgress: reportProgress,
    reportCompletitud: function (pct) {
      return reportProgress({ pctCompletitud: num(pct) });
    },
    reportEvaluacion: function (nota, pctCompletitud) {
      var body = { notaEval: num(nota), evaluacionFinal: true };
      if (pctCompletitud != null) body.pctCompletitud = num(pctCompletitud);
      return reportProgress(body);
    },
  };
})();

(function () {
  'use strict';

  var CLASS_PASS = 70;
  var FINAL_MAX_PTS = 45;
  var SYNC_MS = 8000;
  var lastFingerprint = '';
  var syncing = false;

  function discoverPrefix() {
    var candidates = {};
    var i;
    var key;
    var m;
    for (i = 0; i < localStorage.length; i++) {
      key = localStorage.key(i);
      if (!key) continue;
      if (key.slice(-8) === '-version') {
        candidates[key.slice(0, -8)] = (candidates[key.slice(0, -8)] || 0) + 50;
        continue;
      }
      if (key.slice(-6) === '-final') {
        candidates[key.slice(0, -6)] = (candidates[key.slice(0, -6)] || 0) + 15;
        continue;
      }
      m = key.match(/^(.+)-(\d{1,2})$/);
      if (m) candidates[m[1]] = (candidates[m[1]] || 0) + 1;
    }
    var best = null;
    var bestScore = 0;
    Object.keys(candidates).forEach(function (p) {
      if (candidates[p] > bestScore) {
        best = p;
        bestScore = candidates[p];
      }
    });
    return bestScore >= 1 ? best : null;
  }

  function classNums(prefix) {
    var re = new RegExp('^' + prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '-(\\d+)$');
    var nums = [];
    var i;
    var key;
    var m;
    for (i = 0; i < localStorage.length; i++) {
      key = localStorage.key(i);
      m = key && key.match(re);
      if (m) nums.push(Number(m[1]));
    }
    nums.sort(function (a, b) {
      return a - b;
    });
    return nums;
  }

  function totalClassSlots(prefix, nums) {
    var max = 0;
    var i;
    for (i = 0; i < nums.length; i++) max = Math.max(max, nums[i]);
    return Math.max(max, 7);
  }

  function readState() {
    var prefix = discoverPrefix();
    if (!prefix) return null;
    var nums = classNums(prefix);
    if (!nums.length) return null;

    var slots = totalClassSlots(prefix, nums);
    var totalPercent = 0;
    var approved = 0;
    var scores = [];
    var i;
    var v;

    for (i = 1; i <= slots; i++) {
      v = Number(localStorage.getItem(prefix + '-' + i) || 0);
      scores.push(v);
      totalPercent += v;
      if (v >= CLASS_PASS) approved++;
    }

    var pctCompletitud = Math.round(totalPercent / slots);
    var finalRaw = localStorage.getItem(prefix + '-final');
    var finalPts = finalRaw != null && finalRaw !== '' ? Number(finalRaw) : null;
    var notaEval =
      finalPts != null && finalPts > 0
        ? Math.min(100, Math.round((finalPts / FINAL_MAX_PTS) * 100))
        : null;

    var clases = [];
    var sumaConNota = 0;
    var countConNota = 0;
    for (i = 1; i <= slots; i++) {
      v = Number(localStorage.getItem(prefix + '-' + i) || 0);
      clases.push({
        numero: i,
        pct: v,
        aprobada: v >= CLASS_PASS,
      });
      if (v > 0) {
        sumaConNota += v;
        countConNota++;
      }
    }

    return {
      prefix: prefix,
      pctCompletitud: pctCompletitud,
      approved: approved,
      totalClasses: slots,
      scores: scores,
      clases: clases,
      promedioClases: countConNota ? Math.round(sumaConNota / countConNota) : null,
      finalPts: finalPts,
      notaEval: notaEval,
      fingerprint: prefix + '|' + scores.join(',') + '|' + String(finalPts),
    };
  }

  function sync(force) {
    if (syncing || !window.ARGO || !window.ARGO.ready()) return;
    var st = readState();
    if (!st) return;
    if (!force && st.fingerprint === lastFingerprint) return;

    var body = {
      pctCompletitud: st.pctCompletitud,
      clases: st.clases,
      promedioClases: st.promedioClases,
    };
    if (st.finalPts != null && st.finalPts > 0) {
      body.notaEval = st.notaEval;
      body.evaluacionFinal = true;
    }

    syncing = true;
    window.ARGO.reportProgress(body)
      .then(function () {
        lastFingerprint = st.fingerprint;
      })
      .finally(function () {
        syncing = false;
      });
  }

  function kick(force) {
    setTimeout(function () {
      sync(!!force);
    }, 300);
  }

  try {
    var origSet = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function (key, value) {
      origSet(key, value);
      if (typeof key !== 'string') return;
      var isClassKey = key.indexOf('curso-') === 0 && (/-\d+$/.test(key) || key.slice(-6) === '-final' || key.indexOf('-session') > -1);
      if (isClassKey) {
        setTimeout(function () {
          kick(false);
        }, 0);
      }
    };
  } catch (_e) {
    /* ignore */
  }

  window.addEventListener('storage', function () {
    kick(false);
  });

  var wait = 0;
  var boot = setInterval(function () {
    wait++;
    if (window.ARGO && window.ARGO.ready()) {
      clearInterval(boot);
      kick(true);
      setInterval(function () {
        kick(false);
      }, SYNC_MS);
    } else if (wait > 300) {
      clearInterval(boot);
      console.warn('[ARGO] Sin token del portal — el progreso no se guardará en el aula hasta iniciar sesión.');
    }
  }, 400);

  window.addEventListener('pagehide', function () {
    sync(true);
  });

  window.__argoAutoSync = { kick: kick, readState: readState, sync: sync };
})();
