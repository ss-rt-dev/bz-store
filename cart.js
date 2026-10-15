/**
 * BZM Store – Shared Shopping Cart (localStorage)
 */
const CART_KEY = "bzm_cart";

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
    const summary = cart
      .map(
        (i) =>
          `${i.name}${i.options ? " (" + i.options + ")" : ""} ×${i.qty || 1} = ${formatEuro(
            i.price * (i.qty || 1)
          )}`
      )
      .join("\n");
    const payload = document.getElementById("checkoutCartPayload");
    if (payload) payload.value = summary + "\n\nGesamt: " + formatEuro(cartTotal());
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

function calcMemberPrice(n) {
  n = Math.max(50, Math.min(20000, Number(n) || 50));
  let rate = 0.0025;
  if (n >= 10000) rate = 0.001;
  else if (n >= 5000) rate = 0.0012;
  else if (n >= 1000) rate = 0.0014;
  else if (n >= 500) rate = 0.0016;
  else if (n >= 100) rate = 0.002;
  return Math.max(0.2, Math.round(n * rate * 100) / 100);
}

document.addEventListener("DOMContentLoaded", () => {
  updateCartUI();

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
    checkoutForm.addEventListener("submit", () => {
      setTimeout(() => clearCart(), 500);
    });
  }
});
