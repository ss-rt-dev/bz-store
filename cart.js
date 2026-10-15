/**
 * BZM Store – Shared Shopping Cart (localStorage)
 */
const CART_KEY = "bzm_cart";
const THANKS_URL = "https://bzm-store.vercel.app/danke";
const FORMSUBMIT_URL = "https://formsubmit.co/ajax/teyoorll@gmail.com";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartUI();
}

function addToCart(item) {
  const cart = getCart();
  const key = item.id + (item.options ? JSON.stringify(item.options) : "");
  const existing = cart.find(
    (c) => c.id + (c.options ? JSON.stringify(c.options) : "") === key
  );
  if (existing) {
    existing.qty = (existing.qty || 1) + (item.qty || 1);
    existing.price = item.price;
  } else {
    cart.push({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      qty: item.qty || 1,
      options: item.options || null,
    });
  }
  saveCart(cart);
  showCartToast(item.name);
}

function removeFromCart(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function cartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * (i.qty || 1), 0);
}

function cartCount() {
  return getCart().reduce((sum, i) => sum + (i.qty || 1), 0);
}

function formatEuro(n) {
  return Number(n).toFixed(2).replace(".", ",") + " €";
}

function updateCartUI() {
  const count = cartCount();
  document.querySelectorAll(".cart-count").forEach((el) => {
    el.textContent = count;
    el.style.display = count > 0 ? "flex" : "none";
  });

  const list = document.getElementById("cartItems");
  const totalEl = document.getElementById("cartTotal");
  const emptyEl = document.getElementById("cartEmpty");
  if (!list) return;

  const cart = getCart();
  if (cart.length === 0) {
    list.innerHTML = "";
    if (emptyEl) emptyEl.style.display = "block";
    if (totalEl) totalEl.textContent = "0,00 €";
    return;
  }
  if (emptyEl) emptyEl.style.display = "none";

  list.innerHTML = cart
    .map(
      (item, i) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <strong>${escapeHtml(item.name)}</strong>
        ${item.options ? `<span class="cart-item-opt">${escapeHtml(item.options)}</span>` : ""}
        <span class="cart-item-qty">× ${item.qty || 1}</span>
      </div>
      <div class="cart-item-right">
        <span class="cart-item-price">${formatEuro(item.price * (item.qty || 1))}</span>
        <button type="button" class="cart-item-remove" data-index="${i}" aria-label="Entfernen">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    </div>`
    )
    .join("");

  list.querySelectorAll(".cart-item-remove").forEach((btn) => {
    btn.addEventListener("click", () => removeFromCart(Number(btn.dataset.index)));
  });

  if (totalEl) totalEl.textContent = formatEuro(cartTotal());
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function showCartToast(name) {
  let toast = document.getElementById("cartToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "cartToast";
    toast.className = "cart-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = `„${name}" zum Warenkorb hinzugefügt`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2200);
}

function openCart() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");
  if (drawer) drawer.classList.add("open");
  if (overlay) overlay.classList.add("open");
  document.body.style.overflow = "hidden";
  updateCartUI();
}

function closeCart() {
  const drawer = document.getElementById("cartDrawer");
  const overlay = document.getElementById("cartOverlay");
  if (drawer) drawer.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
  document.body.style.overflow = "";
}

function openCheckout() {
  const cart = getCart();
  if (cart.length === 0) {
    alert("Dein Warenkorb ist leer.");
    return;
  }
  closeCart();
  const modal = document.getElementById("checkoutModal");
  if (modal) {
    fillOrderPayload();
    const totalLabel = document.getElementById("checkoutTotal");
    if (totalLabel) totalLabel.textContent = formatEuro(cartTotal());
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function closeCheckout() {
  const modal = document.getElementById("checkoutModal");
  if (modal) modal.classList.remove("active");
  document.body.style.overflow = "";
}

function buildOrderEmailBody() {
  const cart = getCart();
  const now = new Date();
  const dateStr = now.toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const lines = [];
  lines.push("══════════════════════════════════");
  lines.push("       BZM STORE – BESTELLUNG");
  lines.push("══════════════════════════════════");
  lines.push("");
  lines.push("Datum:  " + dateStr);
  lines.push("Status: Neu – Zahlung per Guthabenkarte");
  lines.push("");
  lines.push("───────── ARTIKEL ─────────");
  cart.forEach((item, idx) => {
    const lineTotal = formatEuro(item.price * (item.qty || 1));
    lines.push("");
    lines.push(idx + 1 + ". " + item.name);
    if (item.options) lines.push("   Option: " + item.options);
    lines.push("   Menge:  " + (item.qty || 1));
    lines.push("   Preis:  " + lineTotal);
  });
  lines.push("");
  lines.push("───────── SUMME ─────────");
  lines.push("Gesamt: " + formatEuro(cartTotal()));
  lines.push("");
  lines.push("══════════════════════════════════");
  lines.push("Zahlung: nur Guthabenkarte");
  lines.push("Nächster Schritt: Kunde anschreiben");
  lines.push("══════════════════════════════════");
  return lines.join("\n");
}

function fillOrderPayload() {
  const payload = document.getElementById("checkoutCartPayload");
  if (payload) payload.value = buildOrderEmailBody();
  const totalField = document.getElementById("checkoutTotalField");
  if (totalField) totalField.value = formatEuro(cartTotal());
  const itemsField = document.getElementById("checkoutItemsField");
  if (itemsField) {
    itemsField.value = getCart()
      .map(
        (i) =>
          i.name +
          (i.options ? " (" + i.options + ")" : "") +
          " ×" +
          (i.qty || 1) +
          " = " +
          formatEuro(i.price * (i.qty || 1))
      )
      .join("\n");
  }
}

function calcMemberPrice(n) {
  n = Math.max(10, Math.min(50000, Number(n) || 10));
  const units = Math.ceil(n / 10);
  const price = units * 0.2;
  return Math.round(price * 100) / 100;
}
function memberUnitLabel(n) {
  const units = Math.ceil(n / 10);
  return units + " × 10er-Pack (0,20 €)";
}

function getAnnounce() {
  try {
    return JSON.parse(localStorage.getItem("bzm_announce") || '{"text":"","enabled":false}');
  } catch {
    return { text: "", enabled: false };
  }
}
function getDiscounts() {
  try {
    return JSON.parse(localStorage.getItem("bzm_discounts") || "[]");
  } catch {
    return [];
  }
}
function findDiscount(code) {
  const c = String(code || "").trim().toUpperCase();
  if (!c) return null;
  return getDiscounts().find((d) => d.code === c) || null;
}
function recordSale(cartItems, total) {
  try {
    const key = "bzm_stats";
    const stats = JSON.parse(
      localStorage.getItem(key) || '{"orders":0,"items":0,"revenue":0,"products":{}}'
    );
    stats.orders = (stats.orders || 0) + 1;
    let items = 0;
    cartItems.forEach((i) => {
      const q = i.qty || 1;
      items += q;
      const name = i.name || i.id;
      if (!stats.products[name]) stats.products[name] = { qty: 0, revenue: 0 };
      stats.products[name].qty += q;
      stats.products[name].revenue += Number(i.price) * q;
    });
    stats.items = (stats.items || 0) + items;
    stats.revenue = (stats.revenue || 0) + Number(total);
    localStorage.setItem(key, JSON.stringify(stats));
  } catch (e) {}
}
function renderAnnounceBanner() {
  const a = getAnnounce();
  let el = document.getElementById("siteAnnounce");
  if (!a.enabled || !a.text) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.id = "siteAnnounce";
    el.className = "site-announce";
    const nav = document.querySelector(".navbar");
    if (nav && nav.nextSibling) nav.parentNode.insertBefore(el, nav.nextSibling);
    else if (nav) nav.parentNode.appendChild(el);
    else document.body.prepend(el);
  }
  el.innerHTML =
    '<div class="site-announce-inner"><i class="fa-solid fa-bullhorn"></i> <span>' +
    String(a.text).replace(/</g, "&lt;") +
    "</span></div>";
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();
  renderAnnounceBanner();

  document.querySelectorAll("[data-open-cart]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openCart();
    });
  });

  const overlay = document.getElementById("cartOverlay");
  if (overlay) overlay.addEventListener("click", closeCart);

  document.querySelectorAll("[data-close-cart]").forEach((btn) => {
    btn.addEventListener("click", closeCart);
  });

  document.querySelectorAll("[data-checkout]").forEach((btn) => {
    btn.addEventListener("click", openCheckout);
  });

  document.querySelectorAll("[data-close-checkout]").forEach((btn) => {
    btn.addEventListener("click", closeCheckout);
  });

  const checkoutForm = document.getElementById("checkoutForm");
  if (checkoutForm) {
    checkoutForm.action = FORMSUBMIT_URL;
    checkoutForm.querySelectorAll('input[name="_next"]').forEach((el) => el.remove());

    checkoutForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      e.stopPropagation();
      fillOrderPayload();
      const form = checkoutForm;
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Wird gesendet…";
      }
      try {
        const fd = new FormData(form);
        fd.delete("_next");
        const res = await fetch(FORMSUBMIT_URL, {
          method: "POST",
          body: fd,
          headers: { Accept: "application/json" },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok && !data.success) throw new Error("send failed");
        const sold = getCart();
        const totalPaid = cartTotal();
        recordSale(sold, totalPaid);
        clearCart();
        window.location.replace(THANKS_URL);
      } catch (err) {
        console.error(err);
        alert(
          "Bestellung konnte nicht gesendet werden. Bitte nochmal versuchen oder uns per Discord schreiben."
        );
        if (btn) {
          btn.disabled = false;
          btn.textContent = "Bestellung senden";
        }
      }
    });
  }
});
