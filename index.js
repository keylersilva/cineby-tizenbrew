(function () {
  "use strict";

  if (window.__cinebyTV) return;
  window.__cinebyTV = true;

  var current = null;
  var lastURL = location.href;

  // Bloquear aperturas de ventanas publicitarias.
  try {
    window.open = function () {
      console.log("Cineby TV: ventana emergente bloqueada");
      return null;
    };
  } catch (e) {}

  // Elementos interactivos de la página.
  var selector = [
    "a[href]",
    "button",
    '[role="button"]',
    '[tabindex]:not([tabindex="-1"])',
    "input",
    "video"
  ].join(",");

  function visible(el) {
    if (!el || !el.isConnected) return false;

    var r = el.getBoundingClientRect();
    var s = getComputedStyle(el);

    return (
      r.width > 8 &&
      r.height > 8 &&
      s.visibility !== "hidden" &&
      s.display !== "none"
    );
  }

  function elements() {
    return Array.prototype.slice
      .call(document.querySelectorAll(selector))
      .filter(visible);
  }

  // Borde azul para saber qué está seleccionado.
  var style = document.createElement("style");

  style.textContent = `
    .cineby-focus {
      outline: 4px solid #00d4ff !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 15px #00d4ff !important;
    }
  `;

  (document.head || document.documentElement).appendChild(style);

  function highlight(el) {
    if (!el) return;

    if (current) {
      current.classList.remove("cineby-focus");
    }

    current = el;
    current.classList.add("cineby-focus");

    current.scrollIntoView({
      block: "nearest",
      inline: "nearest"
    });

    try {
      current.focus({ preventScroll: true });
    } catch (e) {
      current.focus();
    }
  }

  // Navegación espacial: busca el elemento más cercano
  // en la dirección de la flecha presionada.
  function move(key) {
    var items = elements();

    if (!items.length) return;

    if (!current || !visible(current)) {
      highlight(items[0]);
      return;
    }

    var origin = current.getBoundingClientRect();

    var ox = origin.left + origin.width / 2;
    var oy = origin.top + origin.height / 2;

    var best = null;
    var bestScore = Infinity;

    items.forEach(function (el) {
      if (el === current) return;

      var r = el.getBoundingClientRect();

      var dx = r.left + r.width / 2 - ox;
      var dy = r.top + r.height / 2 - oy;

      if (key === "ArrowRight" && dx <= 0) return;
      if (key === "ArrowLeft" && dx >= 0) return;
      if (key === "ArrowDown" && dy <= 0) return;
      if (key === "ArrowUp" && dy >= 0) return;

      var horizontal =
        key === "ArrowRight" || key === "ArrowLeft";

      var primary = horizontal ? Math.abs(dx) : Math.abs(dy);
      var secondary = horizontal ? Math.abs(dy) : Math.abs(dx);

      // Penaliza los elementos muy alejados del eje.
      var score = primary + secondary * 3;

      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    });

    if (best) highlight(best);
  }

  function activate() {
    if (!current || !visible(current)) return;

    if (current.tagName === "VIDEO") {
      if (current.paused) {
        current.play().catch(function () {});
      } else {
        current.pause();
      }
      return;
    }

    if (current.tagName === "INPUT") {
      current.focus();
      return;
    }

    current.click();
  }

  // Permitir volver a la página anterior.
  function goBack() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }

    if (history.length > 1) {
      history.back();
    } else {
      location.href = "https://cineby.ws";
    }
  }

  document.addEventListener(
    "keydown",
    function (event) {
      var key = event.key;

      // No interferir mientras se escribe en el buscador.
      var active = document.activeElement;
      var typing =
        active &&
        (active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA");

      if (
        key === "ArrowUp" ||
        key === "ArrowDown" ||
        key === "ArrowLeft" ||
        key === "ArrowRight"
      ) {
        if (typing) return;

        event.preventDefault();
        event.stopPropagation();

        move(key);
        return;
      }

      if (key === "Enter") {
        if (typing) return;

        event.preventDefault();
        event.stopPropagation();

        activate();
        return;
      }

      if (
        key === "Backspace" ||
        key === "Escape" ||
        event.keyCode === 10009
      ) {
        if (typing) return;

        event.preventDefault();
        event.stopPropagation();

        goBack();
      }
    },
    true
  );

  // Detectar cambios de página dentro de Cineby.
  setInterval(function () {
    if (location.href !== lastURL) {
      lastURL = location.href;
      current = null;
    }

    if (current && !visible(current)) {
      current = null;
    }
  }, 1000);

  console.log("Cineby TV 1.1.0 iniciado");
})();
