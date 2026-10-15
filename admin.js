(function () {
  const SALT = "bzm_store_v1";
  const PIN_HASH = "8da8d5cba0c7d9a62b2a375a4369f2854d50454e5c636e05ea3c6095f4fa47d3";
  const KEYS = {
    session: "bzm_adm_ok",
    announce: "bzm_announce",
    discounts: "bzm_discounts",
    stats: "bzm_stats",
  };

  async function sha256Hex(str) {
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(str)
    );
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  async function checkPin(pin) {
    const h = await sha256Hex(SALT + String(pin).trim());
    if (h.length !== PIN_HASH.length) return false;
    let ok = 0;
    for (let i = 0; i < h.length; i++) ok |= h.charCodeAt(i) ^ PIN_HASH.charCodeAt(i);
    return ok === 0;
  }

  function loadJSON(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
    } catch {
      return fallback;
    }
  }
  function saveJSON(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function unlock() {
    document.getElementById("adminLock").style.display = "none";
    document.getElementById("adminShell").classList.add("open");
    sessionStorage.setItem(KEYS.session, "1");
    loadAnnounceUI();
    loadDiscountsUI();
    loadStatsUI();
  }
  function lock() {
    sessionStorage.removeItem(KEYS.session);
    document.getElementById("adminShell").classList.remove("open");
    document.getElementById("adminLock").style.display = "flex";
    document.getElementById("pinInput").value = "";
  }

  document.querySelectorAll(".admin-nav button").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".admin-nav button").forEach((b) => b.classList.remove("active"));
      document.querySelectorAll(".admin-panel").forEach((p) => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById("panel-" + btn.dataset.panel).classList.add("active");
      if (btn.dataset.panel === "stats") loadStatsUI();
    });
  });

  document.getElementById("pinBtn").addEventListener("click", tryPin);
  document.getElementById("pinInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryPin();
  });
  document.getElementById("adminLogout").addEventListener("click", lock);

  async function tryPin() {
    const err = document.getElementById("pinErr");
    err.textContent = "";
    const pin = document.getElementById("pinInput").value;
    if (!(await checkPin(pin))) {
      err.textContent = "Falscher PIN";
      return;
    }
    unlock();
  }

  if (sessionStorage.getItem(KEYS.session) === "1") unlock();

  function loadAnnounceUI() {
    const a = loadJSON(KEYS.announce, { text: "", enabled: false });
    document.getElementById("annText").value = a.text || "";
    document.getElementById("annEnabled").checked = !!a.enabled;
  }
  document.getElementById("annSave").addEventListener("click", () => {
    saveJSON(KEYS.announce, {
      text: document.getElementById("annText").value.trim(),
      enabled: document.getElementById("annEnabled").checked,
    });
    alert("Ankündigung gespeichert.");
  });

  function loadDiscountsUI() {
    const list = loadJSON(KEYS.discounts, []);
    const tbody = document.getElementById("discList");
    if (!list.length) {
      tbody.innerHTML = '<tr><td colspan="3" style="color:#64748b">Keine Codes</td></tr>';
      return;
    }
    tbody.innerHTML = list
      .map(
        (d, i) =>
          `<tr>
            <td><strong>${escapeHtml(d.code)}</strong></td>
            <td>${d.percent} %</td>
            <td><button type="button" class="btn-admin danger" data-del="${i}">Löschen</button></td>
          </tr>`
      )
      .join("");
    tbody.querySelectorAll("[data-del]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const arr = loadJSON(KEYS.discounts, []);
        arr.splice(Number(btn.dataset.del), 1);
        saveJSON(KEYS.discounts, arr);
        loadDiscountsUI();
      });
    });
  }
  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  document.getElementById("discAdd").addEventListener("click", () => {
    const code = document.getElementById("discCode").value.trim().toUpperCase();
    const percent = Math.min(100, Math.max(1, Number(document.getElementById("discPercent").value) || 0));
    if (!code || percent < 1) {
      alert("Code und Prozent angeben.");
      return;
    }
    const arr = loadJSON(KEYS.discounts, []);
    if (arr.some((d) => d.code === code)) {
      alert("Code existiert schon.");
      return;
    }
    arr.push({ code, percent });
    saveJSON(KEYS.discounts, arr);
    document.getElementById("discCode").value = "";
    loadDiscountsUI();
  });

  function loadStatsUI() {
    const stats = loadJSON(KEYS.stats, { orders: 0, items: 0, revenue: 0, products: {} });
    document.getElementById("statOrders").textContent = stats.orders || 0;
    document.getElementById("statItems").textContent = stats.items || 0;
    document.getElementById("statRevenue").textContent =
      Number(stats.revenue || 0).toFixed(2).replace(".", ",") + " €";
    const prods = stats.products || {};
    const rows = Object.keys(prods)
      .sort((a, b) => (prods[b].qty || 0) - (prods[a].qty || 0))
      .map(
        (name) =>
          `<tr>
            <td>${escapeHtml(name)}</td>
            <td>${prods[name].qty || 0}</td>
            <td>${Number(prods[name].revenue || 0).toFixed(2).replace(".", ",")} €</td>
          </tr>`
      );
    document.getElementById("statProducts").innerHTML =
      rows.length ? rows.join("") : '<tr><td colspan="3" style="color:#64748b">Noch keine Verkäufe</td></tr>';
  }
  document.getElementById("statsReset").addEventListener("click", () => {
    if (!confirm("Alle Stats löschen?")) return;
    saveJSON(KEYS.stats, { orders: 0, items: 0, revenue: 0, products: {} });
    loadStatsUI();
  });
})();
