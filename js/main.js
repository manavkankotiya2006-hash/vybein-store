/*
  VYBEIN storefront behaviour.
  This file uses browser JavaScript only; there are no packages or server APIs.
*/
(function () {
  "use strict";

  const CART_KEY = "vybein-cart-v1";
  let revealObserver = null;
  const formatPrice = (amount) => new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0
  }).format(amount);

  // Escape catalogue values before placing them into HTML templates.
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function getCart() {
    try {
      const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      return Array.isArray(stored)
        ? stored.filter((item) => item && PRODUCTS.some((product) => product.id === String(item.id)))
          .map((item) => ({ id: String(item.id), quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)) }))
        : [];
    } catch (error) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadges();
    renderCartPage();
  }

  function updateCartBadges() {
    const quantity = getCart().reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll("[data-cart-count]").forEach((badge) => {
      badge.textContent = String(quantity);
      badge.setAttribute("aria-label", `${quantity} items in bag`);
    });
  }

  function showToast(message) {
    let toast = document.getElementById("site-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "site-toast";
      toast.className = "site-toast";
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.append(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function addToCart(id, quantity) {
    const product = PRODUCTS.find((item) => item.id === String(id));
    if (!product) return;
    const cart = getCart();
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity += quantity;
    else cart.push({ id: product.id, quantity });
    saveCart(cart);
    showToast(`${product.name} added to your bag`);
  }

  function productCard(product) {
    const name = escapeHTML(product.name);
    const id = encodeURIComponent(product.id);
    const notes = escapeHTML(product.mood);
    const badge = escapeHTML(product.badge);
    const image = escapeHTML(product.image);
    return `
      <article class="product-card" data-reveal>
        <a class="product-card-image" href="product.html?id=${id}" aria-label="View ${name}">
          <img src="${image}" alt="Illustration of the VYBEIN ${name} perfume bottle" loading="lazy">
          <span class="product-badge">${badge}</span>
        </a>
        <div class="product-card-info">
          <div class="product-card-title-row"><h3><a href="product.html?id=${id}">${name}</a></h3><span class="product-card-price">${formatPrice(product.price || STORE_CONFIG.price)}</span></div>
          <p class="product-card-mood">${notes}</p>
          <div class="product-card-actions"><button class="add-button" type="button" data-add-to-cart="${escapeHTML(product.id)}">Add to bag <span aria-hidden="true">+</span></button><a class="quick-view" href="product.html?id=${id}">Discover <span class="icon-arrow" aria-hidden="true"></span></a></div>
        </div>
      </article>`;
  }

  function renderFeaturedProducts() {
    const target = document.getElementById("featured-products");
    if (target) target.innerHTML = PRODUCTS.slice(0, 4).map(productCard).join("");
  }

  function renderShop() {
    const target = document.getElementById("all-products");
    if (!target) return;
    let activeFilter = "all";
    const count = document.getElementById("results-count");
    function applyFilter() {
      const filtered = activeFilter === "all" ? PRODUCTS : PRODUCTS.filter((product) => product.profile === activeFilter);
      target.innerHTML = filtered.map(productCard).join("");
      observeRevealElements(target);
      if (count) count.textContent = `${filtered.length} ${filtered.length === 1 ? "fragrance" : "fragrances"}`;
    }
    document.querySelectorAll("[data-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        document.querySelectorAll("[data-filter]").forEach((chip) => {
          const selected = chip === button;
          chip.classList.toggle("active", selected);
          chip.setAttribute("aria-pressed", String(selected));
        });
        applyFilter();
      });
    });
    applyFilter();
  }

  function renderProductDetail() {
    const target = document.getElementById("product-detail");
    if (!target) return;
    const productId = new URLSearchParams(window.location.search).get("id");
    const product = PRODUCTS.find((item) => item.id === productId);
    const breadcrumb = document.getElementById("breadcrumb-product");
    const relatedTarget = document.getElementById("related-products");

    if (!product) {
      target.innerHTML = `<div class="not-found"><p class="eyebrow">SCENT NOT FOUND</p><h1>Let’s find you another.</h1><p>That fragrance link may be out of date. The full collection is waiting for you.</p><a class="button button-dark" href="shop.html">Explore all scents <span class="icon-arrow" aria-hidden="true"></span></a></div>`;
      if (relatedTarget) relatedTarget.innerHTML = PRODUCTS.slice(0, 3).map(productCard).join("");
      return;
    }

    const safeName = escapeHTML(product.name);
    const safeImage = escapeHTML(product.image);
    const safePrice = formatPrice(product.price || STORE_CONFIG.price);
    if (breadcrumb) breadcrumb.textContent = product.name;
    document.title = `${product.name} Perfume — VYBEIN`;
    const description = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (description) description.content = `${product.name}: ${product.mood} Explore this VYBEIN unisex fragrance for ${safePrice}.`;
    if (ogTitle) ogTitle.content = `${product.name} Perfume — VYBEIN`;
    if (ogDescription) ogDescription.content = `${product.mood} Discover its notes and order for ${safePrice}.`;

    target.innerHTML = `
      <div class="product-detail-image" data-reveal><img src="${safeImage}" alt="Illustration of the VYBEIN ${safeName} bottle and fragrance label"><span class="product-image-caption">VYBEIN · FRAGRANCE ${String(product.id).padStart(2, "0")}</span></div>
      <section class="product-detail-copy" data-reveal>
        <p class="eyebrow">VYBEIN · ${escapeHTML(product.profile).toUpperCase()} SCENT</p>
        <h1>${safeName}</h1><p class="detail-price">${safePrice}</p>
        <p class="detail-mood">${escapeHTML(product.mood)}</p>
        <p class="detail-description">${escapeHTML(product.description)}</p>
        <span class="profile-pill">${escapeHTML(product.profile)} · unisex</span>
        <details class="scent-notes" open><summary><span>Explore the notes</span><span class="notes-count">${product.notes.length} notes</span></summary><ul class="notes-list">${product.notes.map((note) => `<li>${escapeHTML(note)}</li>`).join("")}</ul></details>
        <div class="detail-actions"><button class="button button-dark" type="button" data-add-to-cart="${escapeHTML(product.id)}">Add to bag <span aria-hidden="true">+</span></button><button class="button button-outline-dark detail-share" type="button" data-share-product="${escapeHTML(product.id)}">Share scent <span class="icon-arrow" aria-hidden="true"></span></button></div>
      </section>`;

    if (relatedTarget) relatedTarget.innerHTML = PRODUCTS.filter((item) => item.id !== product.id).slice(0, 3).map(productCard).join("");
    observeRevealElements(target);
    if (relatedTarget) observeRevealElements(relatedTarget);
  }

  function findProduct(id) {
    return PRODUCTS.find((product) => product.id === String(id));
  }

  function renderCartPage() {
    const itemsTarget = document.getElementById("cart-items");
    if (!itemsTarget) return;
    const cart = getCart();
    const validCart = cart.filter((item) => findProduct(item.id));
    const lines = validCart.map((item) => ({ ...item, product: findProduct(item.id) }));
    const itemQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = lines.reduce((sum, item) => sum + item.quantity * (item.product.price || STORE_CONFIG.price), 0);
    const count = document.getElementById("cart-item-count");
    const summary = document.getElementById("cart-summary");
    const checkout = document.getElementById("checkout-panel");
    const checkoutForm = document.getElementById("checkout-form");
    const paymentBox = document.querySelector(".upi-box");
    const flowNote = document.querySelector(".checkout-flow");
    if (count) count.textContent = `${itemQuantity} ${itemQuantity === 1 ? "item" : "items"}`;

    if (!lines.length) {
      itemsTarget.innerHTML = `<div class="empty-cart" data-reveal><span class="empty-cart-mark" aria-hidden="true">V.</span><h3>Your bag is taking a little breather.</h3><p>Find a fragrance that feels like you.</p><a class="button button-dark" href="shop.html">Explore the collection <span class="icon-arrow" aria-hidden="true"></span></a></div>`;
      observeRevealElements(itemsTarget);
      if (summary) summary.innerHTML = `<p class="summary-row"><span>Subtotal</span><strong>${formatPrice(0)}</strong></p>`;
      if (checkout) checkout.classList.add("is-empty");
      if (checkoutForm) checkoutForm.hidden = true;
      if (paymentBox) paymentBox.hidden = true;
      if (flowNote) flowNote.hidden = true;
      return;
    }

    if (checkout) checkout.classList.remove("is-empty");
    if (checkoutForm) checkoutForm.hidden = false;
    if (paymentBox) paymentBox.hidden = false;
    if (flowNote) flowNote.hidden = false;
    itemsTarget.innerHTML = lines.map(({ id, quantity, product }) => `
      <article class="cart-line" data-reveal>
        <a class="cart-line-image" href="product.html?id=${encodeURIComponent(id)}"><img src="${escapeHTML(product.image)}" alt="Illustration of the VYBEIN ${escapeHTML(product.name)} bottle"></a>
        <div class="cart-line-copy"><h3><a href="product.html?id=${encodeURIComponent(id)}">${escapeHTML(product.name)}</a></h3><p>${escapeHTML(product.profile)} · ${formatPrice(product.price || STORE_CONFIG.price)}</p>
          <div class="cart-line-controls"><div class="quantity-control" aria-label="Quantity for ${escapeHTML(product.name)}"><button type="button" data-quantity-change="-1" data-product-id="${escapeHTML(id)}" aria-label="Remove one ${escapeHTML(product.name)}" ${quantity <= 1 ? "disabled" : ""}>−</button><span>${quantity}</span><button type="button" data-quantity-change="1" data-product-id="${escapeHTML(id)}" aria-label="Add one ${escapeHTML(product.name)}">+</button></div><button class="remove-item" type="button" data-remove-item="${escapeHTML(id)}">Remove</button></div>
        </div>
        <strong class="cart-line-price">${formatPrice(quantity * (product.price || STORE_CONFIG.price))}</strong>
      </article>`).join("");
    observeRevealElements(itemsTarget);
    if (summary) {
      summary.innerHTML = `<p class="summary-row"><span>Items (${itemQuantity})</span><strong>${formatPrice(subtotal)}</strong></p><p class="summary-shipping">Delivery charges and timing will be confirmed on WhatsApp.</p><p class="summary-row summary-total"><span>Order total</span><strong>${formatPrice(subtotal)}</strong></p>`;
    }
  }

  function openWhatsApp(message) {
    const url = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
    const tab = window.open(url, "_blank");
    if (tab) tab.opener = null;
    else window.location.assign(url);
  }

  function setupCheckout() {
    const form = document.getElementById("checkout-form");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const cart = getCart().map((item) => ({ ...item, product: findProduct(item.id) })).filter((item) => item.product);
      if (!cart.length) {
        showToast("Your bag is empty. Add a fragrance to continue.");
        return;
      }
      const formData = new FormData(form);
      const subtotal = cart.reduce((sum, item) => sum + item.quantity * (item.product.price || STORE_CONFIG.price), 0);
      const orderLines = cart.map((item) => `• ${item.product.name} × ${item.quantity} — ${formatPrice(item.quantity * (item.product.price || STORE_CONFIG.price))}`).join("\n");
      const message = [
        "Hi VYBEIN, I’d like to place this order:",
        "",
        orderLines,
        "",
        `Order total: ${formatPrice(subtotal)}`,
        "",
        `Name: ${formData.get("name")}`,
        `Phone: ${formData.get("phone")}`,
        `Delivery address: ${formData.get("address")}`,
        "",
        "Please confirm delivery details and share your UPI QR code for payment."
      ].join("\n");
      openWhatsApp(message);
    });
  }

  function setupContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const formData = new FormData(form);
      const message = `Hi VYBEIN, I’m ${formData.get("name")}.\n\n${formData.get("message")}`;
      openWhatsApp(message);
    });
  }

  function setupQuantityControls() {
    document.addEventListener("click", (event) => {
      const addButton = event.target.closest("[data-add-to-cart]");
      if (addButton) {
        addToCart(addButton.dataset.addToCart, Number(addButton.dataset.quantity) || 1);
        addButton.classList.remove("is-added");
        void addButton.offsetWidth;
        addButton.classList.add("is-added");
        window.setTimeout(() => addButton.classList.remove("is-added"), 750);
        return;
      }
      const shareButton = event.target.closest("[data-share-product]");
      if (shareButton) {
        shareProduct(shareButton.dataset.shareProduct);
        return;
      }
      const quantityButton = event.target.closest("[data-quantity-change]");
      if (quantityButton) {
        const cart = getCart();
        const target = cart.find((item) => item.id === quantityButton.dataset.productId);
        if (target) {
          target.quantity = Math.max(1, target.quantity + Number(quantityButton.dataset.quantityChange));
          saveCart(cart);
        }
        return;
      }
      const removeButton = event.target.closest("[data-remove-item]");
      if (removeButton) saveCart(getCart().filter((item) => item.id !== removeButton.dataset.removeItem));
    });
  }

  function setupMobileMenu() {
    const menuButton = document.querySelector(".menu-toggle");
    const menu = document.getElementById("primary-nav");
    if (!menuButton || !menu) return;
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
      menu.classList.toggle("is-open", !isOpen);
    });
    menu.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        menu.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation menu");
      }
    });
    document.addEventListener("click", (event) => {
      if (!menu.contains(event.target) && !menuButton.contains(event.target)) {
        menu.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation menu");
      }
    });
  }

  // A fine gold progress line gives long pages a quiet scroll cue.
  function setupScrollProgress() {
    const progress = document.createElement("div");
    progress.className = "scroll-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.append(progress);

    let frameRequested = false;
    function updateProgress() {
      if (frameRequested) return;
      frameRequested = true;
      window.requestAnimationFrame(() => {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const amount = scrollable > 0 ? window.scrollY / scrollable : 0;
        progress.style.transform = `scaleX(${Math.min(1, Math.max(0, amount))})`;
        frameRequested = false;
      });
    }

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    updateProgress();
  }

  function setCurrentYear() {
    document.querySelectorAll("[data-year]").forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });
  }

  // Bring sections and product cards into view gently as customers scroll.
  function observeRevealElements(root = document) {
    const revealTargets = root.querySelectorAll("[data-reveal]:not(.is-visible)");
    if (!revealTargets.length) return;

    // Browsers without IntersectionObserver still show all page content.
    if (!("IntersectionObserver" in window)) {
      revealTargets.forEach((element) => element.classList.add("is-visible"));
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries, currentObserver) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            currentObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -24px 0px" });
    }

    // Turn on hidden-before-scroll styles only when the observer is ready.
    document.body.classList.add("motion-ready");
    revealTargets.forEach((element, index) => {
      element.style.setProperty("--reveal-delay", `${(index % 4) * 75}ms`);
      revealObserver.observe(element);
    });
  }

  // Share a direct perfume link with the phone's native share sheet, or copy it.
  async function shareProduct(id) {
    const product = findProduct(id);
    if (!product) return;
    const shareData = {
      title: `${product.name} — VYBEIN`,
      text: `${product.mood} Explore it for ₹${product.price || STORE_CONFIG.price}.`,
      url: window.location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        showToast("Scent link copied to your clipboard.");
      } else {
        showToast("Open your browser menu to copy this scent link.");
      }
    } catch (error) {
      if (error.name !== "AbortError") showToast("We could not share the link right now.");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setupMobileMenu();
    setupQuantityControls();
    setupCheckout();
    setupContactForm();
    setupScrollProgress();
    renderFeaturedProducts();
    renderShop();
    renderProductDetail();
    renderCartPage();
    updateCartBadges();
    setCurrentYear();
    observeRevealElements();
  });

  window.addEventListener("storage", () => {
    updateCartBadges();
    renderCartPage();
  });
}());
