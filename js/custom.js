(() => {
  const CONSENT_KEY = "plushouse_cookie_consent";

  function updateConsent(value) {
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: value === "granted" ? "granted" : "denied"
      });
    }
  }

  function createBanner() {
    const banner = document.createElement("div");
    banner.className = "cookie-consent";
    banner.innerHTML = `
      <div class="cookie-consent__content">
        <div class="cookie-consent__text">
          <strong>Používáme cookies</strong>
          <span>Pomáhají nám zlepšovat web. Souhlas můžete kdykoli změnit v zásadách ochrany osobních údajů.</span>
        </div>
        <div class="cookie-consent__actions">
          <a class="cookie-consent__link" href="https://plushouse.cz/zasady_ochrany_os_udaju.html" target="_blank" rel="noopener">Více informací</a>
          <button type="button" class="cookie-consent__btn cookie-consent__btn--ghost" data-consent="denied">Odmítnout</button>
          <button type="button" class="cookie-consent__btn" data-consent="granted">Přijmout</button>
        </div>
      </div>
    `;

    banner.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-consent]");
      if (!button) return;
      const consent = button.getAttribute("data-consent");
      localStorage.setItem(CONSENT_KEY, consent);
      updateConsent(consent);
      banner.remove();
    });

    document.body.appendChild(banner);
  }

  function initCookieConsent() {
    if (typeof window === "undefined") return;
    const existing = localStorage.getItem(CONSENT_KEY);
    if (existing) {
      updateConsent(existing);
      return;
    }
    createBanner();
  }

  document.addEventListener("DOMContentLoaded", initCookieConsent);
})();

(() => {
  function bindMenuToggle() {
    var nav = document.getElementById("pix-navbar-collapse");
    if (!nav || typeof window.jQuery === "undefined") return;
    window.jQuery(nav)
      .on("shown.bs.collapse", function () {
        document.body.classList.add("menu-open");
      })
      .on("hidden.bs.collapse", function () {
        document.body.classList.remove("menu-open");
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindMenuToggle);
  } else {
    bindMenuToggle();
  }
})();
