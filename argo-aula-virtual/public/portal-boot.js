(function () {
  var KEY_PREFIX = 'argo.portal.theme.';
  var root = document.documentElement;
  root.classList.add('portal-booting');

  try {
    var raw = localStorage.getItem(KEY_PREFIX + location.hostname);
    if (!raw) return;
    var data = JSON.parse(raw);
    if (!data || data.v !== 1 || !data.vars) return;
    Object.keys(data.vars).forEach(function (k) {
      if (data.vars[k]) root.style.setProperty(k, data.vars[k]);
    });
    if (data.heroEstilo) root.dataset.heroEstilo = data.heroEstilo;
    if (data.nombreCea) document.title = data.nombreCea;
  } catch (e) {
    /* sin caché válida */
  }
})();
