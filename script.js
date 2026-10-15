// ===== Mobile Menu (simple) =====
const mobileBtn = document.querySelector(".mobile-menu-btn");
const navLinks = document.querySelector(".nav-links");

if (mobileBtn) {
  mobileBtn.addEventListener("click", () => {
    navLinks.style.display = navLinks.style.display === "flex" ? "none" : "flex";
    if (navLinks.style.display === "flex") {
      navLinks.style.position = "absolute";
      navLinks.style.top = "100%";
      navLinks.style.left = "0";
      navLinks.style.right = "0";
      navLinks.style.flexDirection = "column";
      navLinks.style.background = "rgba(10, 10, 15, 0.95)";
      navLinks.style.padding = "1rem";
      navLinks.style.borderRadius = "12px";
      navLinks.style.marginTop = "0.5rem";
      navLinks.style.gap = "1rem";
    }
  });
}

// ===== FAQ Accordion =====
document.querySelectorAll(".faq-question").forEach((btn) => {
  btn.addEventListener("click", () => {
    const item = btn.closest(".faq-item");
    const isActive = item.classList.contains("active");

    document.querySelectorAll(".faq-item").forEach((i) => i.classList.remove("active"));

    if (!isActive) {
      item.classList.add("active");
    }
  });
});

// ===== Order Modal =====
const modal = document.getElementById("orderModal");
const modalProduct = document.getElementById("modalProduct");
const modalPrice = document.getElementById("modalPrice");
const orderForm = document.getElementById("orderForm");

const productNames = {
  "boost-1": "Discord Boost – 1 Monat",
  "boost-2": "Discord Boost – 2 Monate",
  "boost-3": "Discord Boost – 3 Monate",
  "boost-6": "Discord Boost – 6 Monate",
  "members-100": "Bot Members – 100",
  "members-500": "Bot Members – 500",
  "members-1000": "Bot Members – 1.000",
  "members-5000": "Bot Members – 5.000",
  "vanity": "Vanity URL",
  "custom-bot": "Custom Bot",
  "server-design": "Server Design",
  "nitro": "Discord Nitro",
  "mod-setup": "Moderation Setup",
  "banner": "Banner & Icons",
  "emojis": "Custom Emojis",
  "tickets": "Ticket System",
  "giveaway": "Giveaway Setup",
  "leveling": "Leveling System",
  "music-bot": "Music Bot",
  "template": "Server Template",
  "partner": "Partner / Promo",
  "animated-banner": "Animated Banner",
};

document.querySelectorAll(".buy-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const product = btn.dataset.product;
    const price = btn.dataset.price;

    modalProduct.textContent = productNames[product] || product;
    modalPrice.textContent = parseFloat(price).toFixed(2).replace(".", ",") + " €";

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  });
});

document.querySelector(".modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

function closeModal() {
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

orderForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const discord = document.getElementById("discord").value;
  alert(
    `Danke für deine Bestellung!\n\nProdukt: ${modalProduct.textContent}\nDiscord: ${discord}\n\nSende jetzt deine Guthabenkarte an Discord: bzstore\n\nDu erhältst die Lieferung innerhalb weniger Minuten.`
  );
  closeModal();
  orderForm.reset();
});

// ===== Simple Scroll Animations =====
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("aos-animate");
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll("[data-aos]").forEach((el) => observer.observe(el));

// ===== Navbar glass stronger on scroll =====
const navbar = document.querySelector(".navbar");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) {
    navbar.style.background = "rgba(10, 10, 15, 0.8)";
  } else {
    navbar.style.background = "";
  }
});
