(function () {
  "use strict";

  if (window.__CINEBY_TV_120__) return;
  window.__CINEBY_TV_120__ = true;

  const HOME = "https://cineby.ws/";
  const VERSION = "1.2.0";

  let current = null;

  // ==========================================
  // 1. PROTECCIÓN CONTRA VENTANAS EMERGENTES
  // ==========================================

  try {
    window.open = function () {
      console.log("[Cineby TV] Popup bloqueado");
      return null;
    };
  } catch (e) {}

  // Evitar que enlaces abran otras ventanas.
  function cleanLinks() {
    document.querySelectorAll("a[target]").forEach(a => {
      a.removeAttribute("target");
    });
  }

  // ==========================================
  // 2. PROTECCIÓN CONTRA ENLACES EXTERNOS
  // ==========================================

  function isAllowedURL(url) {
    try {
      const target = new URL(url, location.href);

      // Permitir navegación interna.
      if (target.origin === location.origin) {
        return true;
      }

      // Permitir enlaces internos especiales.
      if (
        target.protocol === "about:" ||
        target.protocol === "blob:"
      ) {
        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  }

  document.addEventListener(
    "click",
    function (event) {
      const link = event.target.closest("a[href]");

      if (!link) return;

      const url = link.href;

      if (!isAllowedURL(url)) {
        console.log("[Cineby TV] Enlace externo bloqueado:", url);

        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  // ==========================================
  // 3. NAVEGACIÓN CON CONTROL SAMSUNG
  // ==========================================

  const selector = [
    "a[href]",
    "button",
    '[role="button"]',
    '[tabindex]:not([tabindex="-1"])',
    "input",
    "video"
  ].join(",");

  function visible(el) {
    if (!el || !el.isConnected) return false;

    const r = el.getBoundingClientRect();
    const s = getComputedStyle(el);

    return (
      r.width > 8 &&
      r.height > 8 &&
      s.display !== "none" &&
      s.visibility !== "hidden"
    );
  }

  function elements() {
    return Array.from(
      document.querySelectorAll(selector)
    ).filter(visible);
  }

  // ==========================================
  // 4. BORDE AZUL DE SELECCIÓN
  // ==========================================

  const style = document.createElement("style");

  style.textContent = `
    .cineby-tv-focus {
      outline: 4px solid #00d4ff !important;
      outline-offset: 3px !important;
      box-shadow: 0 0 14px rgba(0,212,255,.7) !important;
    }
  `;

  (document.head || document.documentElement)
    .appendChild(style);

  function highlight(el) {
    if (!el) return;

    if (current) {
      current.classList.remove("cineby-tv-focus");
    }

    current = el;
    current.classList.add("cineby-tv-focus");

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

  // ==========================================
  // 5. SELECCIÓN ESPACIAL
  // ==========================================

  function move(direction) {
    const items = elements();

    if (!items.length) return;

    if (!current || !visible(current)) {
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

      // Favorecer elementos alineados.
      const score = primary + secondary * 4;

      if (score < bestScore) {
        bestScore = score;
        best = el;
      }
    });

    if (best) highlight(best);
  }

  // ==========================================
  // 6. BOTÓN OK
  // ==========================================

  function activate() {
    if (!current || !visible(current)) return;

    if (current.tagName === "VIDEO") {
      if (current.paused) {
        current.play().catch(() => {});
      } else {
        current.pause();
      }

      return;
    }

    if (current.tagName === "INPUT") {
      current.focus();
      return;
    }

    // Evitar abrir enlaces externos.
    if (
      current.tagName === "A" &&
      !isAllowedURL(current.href)
    ) {
      console.log("[Cineby TV] Enlace externo rechazado");
      return;
    }

    current.click();
  }

  // ==========================================
  // 7. BOTÓN ATRÁS
  // ==========================================

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

  // ==========================================
  // 8. CONTROL REMOTO
  // ==========================================

  document.addEventListener(
    "keydown",
    function (event) {
      const key = event.key;
      const code = event.keyCode;

      const active = document.activeElement;

      const typing =
        active &&
        (
          active.tagName === "INPUT" ||
          active.tagName === "TEXTAREA" ||
          active.isContentEditable
        );

      const arrows = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight"
      ];

      if (arrows.includes(key)) {
        if (typing) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        move(key);
        return;
      }

      if (key === "Enter" || code === 13) {
        if (typing) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        activate();
        return;
      }

      if (
        key === "Escape" ||
        key === "Backspace" ||
        code === 10009
      ) {
        if (typing) {
          active.blur();
          return;
        }

        event.preventDefault();
        event.stopImmediatePropagation();

        goBack();
      }
    },
    true
  );

  // ==========================================
  // 9. MANTENIMIENTO
  // ==========================================

  const observer = new MutationObserver(function () {
    cleanLinks();

    if (current && !visible(current)) {
      current = null;
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  cleanLinks();

  console.log("Cineby TV " + VERSION + " iniciado");
})();
