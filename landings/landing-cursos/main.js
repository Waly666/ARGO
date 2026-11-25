(function () {
  var island = document.querySelector("[data-island]");
  if (!island) return;
  var track = island.querySelector(".island__track");
  var prev = island.querySelector("[data-island-prev]");
  var next = island.querySelector("[data-island-next]");
  var dots = island.querySelector(".island__dots");
  var cards = Array.prototype.slice.call(track.querySelectorAll(".skill"));

  cards.forEach(function (_, i) {
    var dot = document.createElement("button");
    dot.type = "button";
    dot.className = "island__dot";
    dot.setAttribute("aria-label", "Ir a la habilidad " + String(i + 1).padStart(2, "0"));
    dot.addEventListener("click", function () { ir(i); });
    dots.appendChild(dot);
  });

  function paso() {
    if (!cards[0]) return track.clientWidth;
    return cards[0].getBoundingClientRect().width + 16;
  }

  function indice() {
    var salto = paso();
    if (!salto) return 0;
    return Math.min(cards.length - 1, Math.max(0, Math.round(track.scrollLeft / salto)));
  }

  function pintar() {
    var actual = indice();
    Array.prototype.forEach.call(dots.children, function (dot, n) {
      dot.classList.toggle("is-on", n === actual);
    });
    prev.disabled = actual <= 0;
    next.disabled = actual >= cards.length - 1;
  }

  function ir(i) {
    var suave = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    track.scrollTo({ left: i * paso(), behavior: suave ? "smooth" : "auto" });
  }

  prev.addEventListener("click", function () { ir(Math.max(0, indice() - 1)); });
  next.addEventListener("click", function () { ir(Math.min(cards.length - 1, indice() + 1)); });
  track.addEventListener("scroll", pintar, { passive: true });
  pintar();
})();
