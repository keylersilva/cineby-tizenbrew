
(function () {
  "use strict";

  let current = -1;

  const selector = [
    "a[href]",
    "button",
    '[role="button"]',
    '[tabindex]:not([tabindex="-1"])'
  ].join(",");

  function elements() {
    return [...document.querySelectorAll(selector)]
      .filter(el => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        return r.width > 5 &&
          r.height > 5 &&
          s.visibility !== "hidden" &&
          s.display !== "none";
      });
  }

  function highlight(el) {
    document.querySelectorAll(".cineby-focus")
      .forEach(e => e.classList.remove("cineby-focus"));

    el.classList.add("cineby-focus");
    el.scrollIntoView({
      block: "nearest",
      inline: "nearest"
    });
    el.focus({ preventScroll: true });
  }

  function move(key) {
    const items = elements();
    if (!items.length) return;

    if (current < 0 || current >= items.length) {
      current = 0;
      highlight(items[current]);
      return;
    }

    const origin = items[current].getBoundingClientRect();
    const ox = origin.left + origin.width / 2;
    const oy = origin.top + origin.height / 2;

    let best = -1;
    let score = Infinity;

    items.forEach((el, i) => {
      if (i === current) return;

      const r = el.getBoundingClientRect();
      const dx = r.left + r.width / 2 - ox;
      const dy = r.top + r.height / 2 - oy;

      if (
        (key === "ArrowRight" && dx <= 0) ||
        (key === "ArrowLeft" && dx >= 0) ||
        (key === "ArrowDown" && dy <= 0) ||
        (key === "ArrowUp" && dy >= 0)
      ) return;

      const primary = key === "ArrowLeft" ||
        key === "ArrowRight" ? Math.abs(dx) : Math.abs(dy);

      const secondary = key === "ArrowLeft" ||
        key === "ArrowRight" ? Math.abs(dy) : Math.abs(dx);

      const distance = primary + secondary * 2;

      if (distance < score) {
        score = distance;
        best = i;
      }
    });

    if (best !== -1) {
      current = best;
      highlight(items[current]);
    }
  }

  const style = document.createElement("style");
  style.textContent = `
    .cineby-focus {
      outline: 4px solid #00d4ff !important;
      outline-offset: 3px !important;
    }
  `;
  document.head.appendChild(style);

  document.addEventListener("keydown", event => {
    const keys = [
      "ArrowUp", "ArrowDown",
      "ArrowLeft", "ArrowRight"
    ];

    if (keys.includes(event.key)) {
      event.preventDefault();
      move(event.key);
    } else if (event.key === "Enter") {
      const items = elements();
      if (items[current]) {
        event.preventDefault();
        items[current].click();
      }
    }
  }, true);
})();
