/* ============================================================
   ui.js — toasts, scroll reveal, page transitions
   Loaded on every page. Lightweight, zero dependencies.
   ============================================================ */

/* ----- TOAST SYSTEM ----- */
(function injectToastStyles() {
  if (document.getElementById("toast-styles")) return;
  const style = document.createElement("style");
  style.id = "toast-styles";
  style.textContent = `
    #toast-stack { position: fixed; top: 20px; right: 20px; z-index: 99999; display: flex; flex-direction: column; gap: 10px; pointer-events: none; max-width: calc(100vw - 40px); }
    .toast { pointer-events: auto; min-width: 250px; max-width: 360px; padding: 14px 18px; border-radius: 10px; color: #fff; font-family: 'Inter', sans-serif; font-size: 0.9rem; line-height: 1.4; box-shadow: 0 10px 30px rgba(0,0,0,0.3); transform: translateX(420px); transition: transform 0.35s cubic-bezier(0.2,0.9,0.3,1), opacity 0.35s; opacity: 0; }
    .toast.visible { transform: translateX(0); opacity: 1; }
    .toast.success { background: linear-gradient(135deg, #10b981, #059669); }
    .toast.error { background: linear-gradient(135deg, #ef4444, #dc2626); }
    .toast.info { background: linear-gradient(135deg, #6c63ff, #00e5ff); }
    @media (max-width: 480px) {
      #toast-stack { top: 10px; right: 10px; left: 10px; max-width: none; }
      .toast { min-width: 0; max-width: 100%; }
    }
  `;
  document.head.appendChild(style);
})();

window.toast = function (msg, type = "info", duration = 4000) {
  let stack = document.getElementById("toast-stack");
  if (!stack) {
    stack = document.createElement("div");
    stack.id = "toast-stack";
    document.body.appendChild(stack);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  el.setAttribute("role", "alert");
  stack.appendChild(el);
  // Force reflow then animate in
  requestAnimationFrame(() => el.classList.add("visible"));
  setTimeout(() => {
    el.classList.remove("visible");
    setTimeout(() => el.remove(), 350);
  }, duration);
};

/* ----- SCROLL REVEAL ----- */
(function injectRevealStyles() {
  if (document.getElementById("reveal-styles")) return;
  const style = document.createElement("style");
  style.id = "reveal-styles";
  style.textContent = `
    .reveal { opacity: 0; transform: translateY(24px); transition: opacity 0.7s ease, transform 0.7s ease; }
    .reveal.visible { opacity: 1; transform: none; }
    @media (prefers-reduced-motion: reduce) {
      .reveal { opacity: 1; transform: none; transition: none; }
    }
  `;
  document.head.appendChild(style);
})();

document.addEventListener("DOMContentLoaded", () => {
  if (!("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal").forEach(el => el.classList.add("visible"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add("visible");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18 });
  document.querySelectorAll(".reveal").forEach(el => io.observe(el));
});

/* ----- PAGE TRANSITIONS ----- */
(function injectTransitionStyles() {
  const style = document.createElement("style");
  style.textContent = `
    body { opacity: 0; transition: opacity 0.35s ease; }
    body.page-loaded { opacity: 1; }
    body.page-leaving { opacity: 0; }
  `;
  document.head.appendChild(style);
})();

window.addEventListener("load", () => {
  document.body.classList.add("page-loaded");
});

document.addEventListener("click", (e) => {
  const a = e.target.closest("a");
  if (!a) return;
  const href = a.getAttribute("href");
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
  if (a.target === "_blank" || a.hasAttribute("download")) return;
  // Only intercept same-origin internal links
  try {
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    e.preventDefault();
    document.body.classList.add("page-leaving");
    setTimeout(() => { window.location.href = a.href; }, 250);
  } catch (_) { /* ignore */ }
});

/* ----- HAMBURGER ARIA ----- */
document.addEventListener("DOMContentLoaded", () => {
  const burger = document.getElementById("hamburger");
  const menu = document.getElementById("mobileMenu");
  if (!burger || !menu) return;
  burger.setAttribute("aria-expanded", "false");
  burger.setAttribute("aria-controls", "mobileMenu");
  burger.setAttribute("aria-label", "Toggle menu");
  // Watch for class changes (existing code adds/removes 'active' or 'open')
  const sync = () => {
    const isOpen = menu.classList.contains("active") || menu.classList.contains("open");
    burger.setAttribute("aria-expanded", isOpen ? "true" : "false");
  };
  new MutationObserver(sync).observe(menu, { attributes: true, attributeFilter: ["class"] });
  // Close menu on link tap
  menu.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      menu.classList.remove("active");
      menu.classList.remove("open");
    });
  });
});

/* ----- SERVICE WORKER REGISTRATION ----- */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swPath = location.pathname.includes("/pages/") ? "../sw.js" : "/sw.js";
    navigator.serviceWorker.register(swPath).catch(() => {/* silent */});
  });
}
