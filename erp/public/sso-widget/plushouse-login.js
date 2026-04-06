/**
 * PlusHouse SSO Login Widget
 *
 * Vložte na plushouse.cz nebo plusconnect.cz:
 * <script src="https://erp.plushouse.cz/sso-widget/plushouse-login.js"></script>
 * <div id="plushouse-login"></div>
 *
 * Nebo jen tlačítko:
 * <button onclick="PlusHouseSSO.login()">Přihlásit se</button>
 */
(function() {
  'use strict';

  const SSO_API = 'https://erp.plushouse.cz/api/sso';
  const ERP_URL = 'https://erp.plushouse.cz';
  const STORAGE_KEY = 'plushouse_sso_token';
  const USER_KEY = 'plushouse_user';

  // PlusHouse SSO Global Object
  window.PlusHouseSSO = {
    // Current user
    user: null,
    token: null,

    // Initialize - check if already logged in
    init: function() {
      const token = localStorage.getItem(STORAGE_KEY);
      if (token) {
        this.verifyToken(token);
      }
      // Check URL for SSO token (redirect flow)
      const urlParams = new URLSearchParams(window.location.search);
      const ssoToken = urlParams.get('sso_token');
      if (ssoToken) {
        localStorage.setItem(STORAGE_KEY, ssoToken);
        this.verifyToken(ssoToken);
        // Clean URL
        const cleanUrl = window.location.href.split('?')[0];
        window.history.replaceState({}, '', cleanUrl);
      }
      this.renderWidget();
    },

    // Login with email/password
    login: function(email, password) {
      if (!email || !password) {
        this.showLoginModal();
        return;
      }

      return fetch(SSO_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email: email, password: password }),
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.success) {
          localStorage.setItem(STORAGE_KEY, data.token);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          PlusHouseSSO.token = data.token;
          PlusHouseSSO.user = data.user;
          PlusHouseSSO.renderWidget();
          PlusHouseSSO.closeModal();
          // Fire event
          window.dispatchEvent(new CustomEvent('plushouse:login', { detail: data.user }));
          return data;
        } else {
          throw new Error(data.error || 'Přihlášení selhalo');
        }
      });
    },

    // Verify token
    verifyToken: function(token) {
      fetch(SSO_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', token: token }),
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
        if (data.valid) {
          PlusHouseSSO.token = token;
          PlusHouseSSO.user = data.user;
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          PlusHouseSSO.renderWidget();
          window.dispatchEvent(new CustomEvent('plushouse:login', { detail: data.user }));
        } else {
          PlusHouseSSO.logout();
        }
      })
      .catch(function() {
        // Try cached user
        var cached = localStorage.getItem(USER_KEY);
        if (cached) {
          PlusHouseSSO.user = JSON.parse(cached);
          PlusHouseSSO.token = token;
          PlusHouseSSO.renderWidget();
        }
      });
    },

    // Logout
    logout: function() {
      var token = localStorage.getItem(STORAGE_KEY);
      if (token) {
        fetch(SSO_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'logout', token: token }),
        }).catch(function() {});
      }
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(USER_KEY);
      this.token = null;
      this.user = null;
      this.renderWidget();
      window.dispatchEvent(new CustomEvent('plushouse:logout'));
    },

    // Redirect to ERP
    openERP: function() {
      var url = ERP_URL;
      if (this.token) url += '?sso_token=' + this.token;
      window.open(url, '_blank');
    },

    // Show login modal
    showLoginModal: function() {
      if (document.getElementById('ph-sso-modal')) return;

      var overlay = document.createElement('div');
      overlay.id = 'ph-sso-modal';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
      overlay.onclick = function(e) { if (e.target === overlay) PlusHouseSSO.closeModal(); };

      overlay.innerHTML = '\
        <div style="background:white;border-radius:16px;padding:32px;width:100%;max-width:380px;box-shadow:0 25px 50px rgba(0,0,0,0.25);margin:16px;">\
          <div style="text-align:center;margin-bottom:24px;">\
            <div style="width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#3b82f6,#6366f1);display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">\
              <span style="color:white;font-weight:bold;font-size:18px;">PH</span>\
            </div>\
            <h2 style="font-size:20px;font-weight:700;color:#0f172a;margin:0;">Přihlášení</h2>\
            <p style="font-size:14px;color:#64748b;margin:4px 0 0;">PlusHouse účet</p>\
          </div>\
          <div id="ph-sso-error" style="display:none;background:#fef2f2;color:#dc2626;padding:10px;border-radius:8px;font-size:13px;margin-bottom:16px;"></div>\
          <form id="ph-sso-form" style="display:flex;flex-direction:column;gap:12px;">\
            <input id="ph-sso-email" type="email" placeholder="Email" required style="height:42px;border:1px solid #e2e8f0;border-radius:10px;padding:0 14px;font-size:14px;outline:none;transition:border-color 0.2s;" onfocus="this.style.borderColor=\'#3b82f6\'" onblur="this.style.borderColor=\'#e2e8f0\'">\
            <input id="ph-sso-password" type="password" placeholder="Heslo" required style="height:42px;border:1px solid #e2e8f0;border-radius:10px;padding:0 14px;font-size:14px;outline:none;transition:border-color 0.2s;" onfocus="this.style.borderColor=\'#3b82f6\'" onblur="this.style.borderColor=\'#e2e8f0\'">\
            <button type="submit" id="ph-sso-submit" style="height:42px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity 0.2s;" onmouseover="this.style.opacity=\'0.9\'" onmouseout="this.style.opacity=\'1\'">Přihlásit se</button>\
          </form>\
          <div style="text-align:center;margin-top:16px;">\
            <span style="font-size:12px;color:#94a3b8;">Přihlášení platí pro plushouse.cz, ERP a PlusConnect</span>\
          </div>\
        </div>';

      document.body.appendChild(overlay);

      document.getElementById('ph-sso-form').onsubmit = function(e) {
        e.preventDefault();
        var email = document.getElementById('ph-sso-email').value;
        var password = document.getElementById('ph-sso-password').value;
        var btn = document.getElementById('ph-sso-submit');
        var err = document.getElementById('ph-sso-error');
        btn.textContent = 'Přihlašuji...';
        btn.disabled = true;
        err.style.display = 'none';

        PlusHouseSSO.login(email, password)
          .catch(function(error) {
            err.textContent = error.message;
            err.style.display = 'block';
            btn.textContent = 'Přihlásit se';
            btn.disabled = false;
          });
      };
    },

    // Close modal
    closeModal: function() {
      var modal = document.getElementById('ph-sso-modal');
      if (modal) modal.remove();
    },

    // Render login widget into #plushouse-login
    renderWidget: function() {
      var container = document.getElementById('plushouse-login');
      if (!container) return;

      if (this.user) {
        container.innerHTML = '\
          <div style="display:inline-flex;align-items:center;gap:10px;padding:6px 12px 6px 6px;background:white;border:1px solid #e2e8f0;border-radius:999px;font-family:-apple-system,system-ui,sans-serif;box-shadow:0 1px 3px rgba(0,0,0,0.05);">\
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#3b82f6,#6366f1);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:12px;">' + (this.user.name || this.user.email).charAt(0).toUpperCase() + '</div>\
            <span style="font-size:13px;font-weight:500;color:#0f172a;">' + (this.user.name || this.user.email) + '</span>\
            <button onclick="PlusHouseSSO.openERP()" style="background:#f1f5f9;border:none;padding:4px 10px;border-radius:6px;font-size:11px;font-weight:600;color:#3b82f6;cursor:pointer;">ERP</button>\
            <button onclick="PlusHouseSSO.logout()" style="background:none;border:none;padding:4px;cursor:pointer;color:#94a3b8;font-size:12px;" title="Odhlásit">✕</button>\
          </div>';
      } else {
        container.innerHTML = '\
          <button onclick="PlusHouseSSO.login()" style="display:inline-flex;align-items:center;gap:8px;padding:8px 20px;background:linear-gradient(135deg,#3b82f6,#6366f1);color:white;border:none;border-radius:999px;font-size:14px;font-weight:600;cursor:pointer;font-family:-apple-system,system-ui,sans-serif;box-shadow:0 2px 8px rgba(59,130,246,0.3);transition:all 0.2s;" onmouseover="this.style.transform=\'translateY(-1px)\';this.style.boxShadow=\'0 4px 12px rgba(59,130,246,0.4)\'" onmouseout="this.style.transform=\'none\';this.style.boxShadow=\'0 2px 8px rgba(59,130,246,0.3)\'">\
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>\
            Přihlásit se\
          </button>';
      }
    },
  };

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { PlusHouseSSO.init(); });
  } else {
    PlusHouseSSO.init();
  }
})();
