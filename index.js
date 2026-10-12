
(function () {
  "use strict";

  if (window.__CINEBY_TV_140__) return;
  window.__CINEBY_TV_140__ = true;

  const HOME = "https://cineby.ws/";
  let current = null;

  // Mantener bloqueo de ventanas emergentes.
  try {
    window.open = function () {
      return null;
    };
  } catch (e) {}

  function allowed(url) {
    try {
      const u = new URL(url, location.href);
      return (
        u.origin === location.origin ||
        u.protocol === "blob:" ||
        u.protocol === "about:"
      );
    } catch (e) {
      return false;
    }
  }

  document.addEventListener("click", function (e) {
    const link = e.target.closest("a[href]");

    if (link && !allowed(link.href)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  // Resaltado visual.
  const style = document.createElement("style");
  style.textContent = `
    .cineby-focus {
      outline: 4px solid #00d4ff !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 18px rgba(0,212,255,.8) !important;
    }

    .content-card > a.cineby-focus {
      display: block !important;
      border-radius: 8px !important;
    }

    #playerPlayBtn.cineby-focus {
      outline: 5px solid #00d4ff !important;
      box-shadow: 0 0 25px #00d4ff !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);

  function isVisible(el) {
    if (!el || !el.isConnected) return false;

    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);

    return (
      r.width > 12 &&
      r.height > 12 &&
      s.display !== "none" &&
      s.visibility !== "hidden" &&
      s.opacity !== "0" &&
      !el.closest("[hidden], [inert]")
    );
  }

  // Solo elementos realmente interactivos.
  function getItems() {
    const selector = [
      ".content-card > a[href]",
      ".content-card > .cb-shelf-add",
      "#play-movie-btn",
      "#playerPlayBtn",
      ".dp-mobile-actions .dp-play-btn",
      ".cb-shelf-act",
      ".server-tab",
      ".slider-prev",
      ".slider-next",
      "a[href]",
      "button",
      "input",
      "select",
      "summary",
      '[role="button"]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(",");

    const elements = Array.from(
      document.querySelectorAll(selector)
    ).filter(isVisible);

    return elements.filter((el, index) => {
      if (elements.indexOf(el) !== index) return false;

      // No seleccionar el contenedor de una tarjeta.
      if (el.matches(".content-card")) return false;

      // El botón de reproducción debe ser independiente.
      if (
        el.id === "playerPlayBtn" &&
        !isVisible(el)
      ) return false;

      return true;
    });
  }

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
    } catch (e) {}
  }

  // Buscar el elemento más cercano en la dirección pulsada.
  function move(direction) {
    const items = getItems();

    if (!items.length) return;

    if (!current || !isVisible(current)) {
      highlight(items[0]);
      return;
    }

    const origin = current.getBoundingClientRect();
    const ox = origin.left + origin.width / 2;
    const oy = origin.top + origin.height / 2;

    let best = null;
    let bestScore = Infinity;

    items.forEach(el => {
      if (el === current) return;

      const r = el.getBoundingClientRect();
      const dx = r.left + r.width / 2 - ox;
      const dy = r.top + r.height / 2 - oy;

      if (direction === "ArrowRight" && dx <= 0) return;
      if (direction === "ArrowLeft" && dx >= 0) return;
      if (direction === "ArrowDown" && dy <= 0) return;
      if (direction === "ArrowUp" && dy >= 0) return;

      const horizontal =
        direction === "ArrowRight" ||
        direction === "ArrowLeft";

      const primary = horizontal
        ? Math.abs(dx)
        : Math.abs(dy);

      const secondary = horizontal
        ? Math.abs(dy)
        : Math.abs(dx);

      let score = primary + secondary * 4;

      // Preferir la portada al botón pequeño de favoritos.
      if (el.matches(".content-card > a")) {
        score *= 0.75;
      }

      // Priorizar el botón real de reproducción.
      if (el.id === "playerPlayBtn") {
        score *= 0.65;
      }

      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    });

    if (best) highlight(best);
  }

  function activate() {
    if (!current || !isVisible(current)) return;

    // Reproducción: activar el botón real.
    if (current.id === "playerPlayBtn") {
      current.click();
      return;
    }

    // Portadas: abrir el enlace de la película.
    if (current.matches(".content-card > a[href]")) {
      if (allowed(current.href)) {
        location.href = current.href;
      }
      return;
    }

    // Favoritos y servidores: ejecutar su evento.
    if (
      current.matches(".cb-shelf-add") ||
      current.matches(".cb-shelf-act") ||
      current.matches(".server-tab")
    ) {
      current.click();
      return;
    }

    if (
      current.tagName === "A" &&
      !allowed(current.href)
    ) {
      return;
    }

    current.click();
  }

  function goBack() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }

    if (history.length > 1) {
      history.back();
    } else {
      location.href = HOME;
    }
  }

  document.addEventListener("keydown", function (e) {
    const active = document.activeElement;

    const typing =
      active &&
      (
        active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.isContentEditable
      );

    if (
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"]
        .includes(e.key)
    ) {
      if (typing) return;

      e.preventDefault();
      e.stopImmediatePropagation();
      move(e.key);
      return;
    }

    if (e.key === "Enter" || e.keyCode === 13) {
      if (typing) return;

      e.preventDefault();
      e.stopImmediatePropagation();
      activate();
      return;
    }

    if (
      e.key === "Escape" ||
      e.key === "Backspace" ||
      e.keyCode === 10009
    ) {
      if (typing) {
        active.blur();
        return;
      }

      e.preventDefault();
      e.stopImmediatePropagation();
      goBack();
    }
  }, true);

  const observer = new MutationObserver(function () {
    if (current && !isVisible(current)) {
      current.classList.remove("cineby-focus");
      current = null;
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  console.log("Cineby TV 1.4.0 iniciado");
})();
