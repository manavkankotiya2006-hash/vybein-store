/*
  VYBEIN storefront behaviour.
  This file uses browser JavaScript only; there are no packages or server APIs.
*/
(function () {
  "use strict";

  const CART_KEY = "vybein-cart-v1";
  let revealObserver = null;
  const formatPrice = (amount) => `Rs. ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0
  }).format(amount)}`;

  // Show the current price beside the crossed-out original price.
  function priceMarkup(product, quantity = 1) {
    const currentPrice = Number(product.price || STORE_CONFIG.price) * quantity;
    const originalPrice = Number(product.originalPrice || STORE_CONFIG.originalPrice || currentPrice) * quantity;
    const current = `<span class="price-current">${formatPrice(currentPrice)}</span>`;
    return originalPrice > currentPrice
      ? `${current}<del class="price-original">${formatPrice(originalPrice)}</del>`
      : current;
  }

  // Escape catalogue values before placing them into HTML templates.
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  // Pair each bottle illustration with its matching front-label artwork.
  // Some products ship a real photo with the label already printed on the
  // bottle; those set labelImage to null and skip the overlay entirely.
  function productArtwork(product, altText, className) {
    const alternateView = className === "product-art-card"
      ? `<img class="product-art-alternate" src="${escapeHTML(product.image)}" alt="" aria-hidden="true" loading="lazy">`
      : "";
    const labelOverlay = product.labelImage
      ? `<img class="product-label-overlay" src="${escapeHTML(product.labelImage)}" alt="" aria-hidden="true" loading="lazy">`
      : "";
    return `
      <span class="product-art ${className}">
        <img class="product-art-base" src="${escapeHTML(product.image)}" alt="${escapeHTML(altText)}" loading="lazy">
        ${alternateView}
        ${labelOverlay}
      </span>`;
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
    const previousOffer = getDiwaliOffer(cart);
    const existing = cart.find((item) => item.id === product.id);
    if (existing) existing.quantity += quantity;
    else cart.push({ id: product.id, quantity });
    const currentOffer = getDiwaliOffer(cart);
    saveCart(cart);
    if (STORE_CONFIG.diwaliOffer?.active) {
      if (currentOffer.freeQuantity > previousOffer.freeQuantity) {
        showToast(`Diwali offer unlocked: ${currentOffer.freeQuantity} perfume${currentOffer.freeQuantity === 1 ? "" : "s"} free!`);
      } else {
        const needed = currentOffer.itemsToNextFree;
        showToast(`${product.name} added. Add ${needed} more perfume${needed === 1 ? "" : "s"} for a free one.`);
      }
    } else {
      showToast(`${product.name} added to your bag`);
    }
  }

  function productCard(product) {
    const name = escapeHTML(product.name);
    const inspiredBy = escapeHTML(product.inspiredBy);
    const id = encodeURIComponent(product.id);
    const notes = escapeHTML(product.mood);
    const category = escapeHTML(product.category);
    const badge = escapeHTML(product.badge);
    return `
      <article class="product-card" data-reveal>
        <a class="product-card-image" href="product.html?id=${id}" aria-label="View ${name}">
          ${productArtwork(product, `VYBEIN ${name}, inspired by ${inspiredBy}, 50 ml perfume bottle with its printed label`, "product-art-card")}
          <span class="product-badge">${badge}</span>
        </a>
        <div class="product-card-info">
          <div class="product-card-title-row"><h3><a href="product.html?id=${id}">${name}</a></h3></div>
          <p class="product-card-inspired">Inspired By ${inspiredBy}</p>
          <div class="product-card-price-row"><div class="product-card-price">${priceMarkup(product)}</div><span class="product-card-volume">${escapeHTML(product.volume || "50 ml")}</span></div>
          <p class="product-card-category">${category}</p>
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
      const filterTerms = {
        fresh: ["fresh", "aquatic"],
        warm: ["warm", "gourmand"],
        woody: ["woody"],
        spiced: ["spiced", "spicy"],
        sweet: ["sweet", "gourmand"]
      };
      const terms = filterTerms[activeFilter] || [];
      const filtered = activeFilter === "all" ? PRODUCTS : PRODUCTS.filter((product) => {
        const category = product.category.toLowerCase();
        return terms.some((term) => category.includes(term));
      });
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
    const safeInspiredBy = escapeHTML(product.inspiredBy);
    const safeCategory = escapeHTML(product.category);
    const safePrice = formatPrice(product.price || STORE_CONFIG.price);
    if (breadcrumb) breadcrumb.textContent = product.name;
    document.title = `${product.name} — Inspired By ${product.inspiredBy} | VYBEIN`;
    const description = document.querySelector('meta[name="description"]');
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDescription = document.querySelector('meta[property="og:description"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (description) description.content = `${product.name}, inspired by ${product.inspiredBy}. ${product.mood} Explore this VYBEIN unisex fragrance for ${safePrice}.`;
    if (ogTitle) ogTitle.content = `${product.name} — Inspired By ${product.inspiredBy} | VYBEIN`;
    if (ogDescription) ogDescription.content = `${product.mood} Discover ${product.category.toLowerCase()} notes and order for ${safePrice}.`;
    if (ogUrl) ogUrl.content = window.location.href;

    target.innerHTML = `
      <div class="product-detail-image" data-reveal>${productArtwork(product, `VYBEIN ${safeName} 50 ml perfume bottle with its printed fragrance label`, "product-art-detail")}<span class="product-image-caption">VYBEIN · FRAGRANCE ${String(product.id).padStart(2, "0")}</span></div>
      <section class="product-detail-copy" data-reveal>
        <p class="eyebrow">VYBEIN · ${safeCategory.toUpperCase()}</p>
        <h1>${safeName}</h1><p class="detail-inspired">Inspired By ${safeInspiredBy}</p><p class="detail-volume">${escapeHTML(product.volume || "50 ml")}</p>
        <div class="detail-price">${priceMarkup(product)}<span class="price-saving">Save ${formatPrice((product.originalPrice || STORE_CONFIG.originalPrice) - (product.price || STORE_CONFIG.price))}</span></div>
        <p class="detail-mood">${escapeHTML(product.mood)}</p>
        <p class="detail-description">${escapeHTML(product.description)}</p>
        <span class="profile-pill">${safeCategory} · unisex</span>
        <details class="scent-notes" open><summary><span>Explore the notes</span><span class="notes-count">${product.notes.length} notes</span></summary><ul class="notes-list">${product.notes.map((note) => `<li>${escapeHTML(note)}</li>`).join("")}</ul></details>
        <div class="detail-actions"><button class="button button-dark" type="button" data-add-to-cart="${escapeHTML(product.id)}">Add to bag <span aria-hidden="true">+</span></button><a class="button button-outline-dark" href="cart.html">Go to your bag <span class="icon-arrow" aria-hidden="true"></span></a></div>
        <button class="detail-share" type="button" data-share-product="${escapeHTML(product.id)}">Share this scent <span class="icon-arrow" aria-hidden="true"></span></button>
      </section>`;

    if (relatedTarget) relatedTarget.innerHTML = PRODUCTS.filter((item) => item.id !== product.id).slice(0, 3).map(productCard).join("");
    observeRevealElements(target);
    if (relatedTarget) observeRevealElements(relatedTarget);
  }

  function findProduct(id) {
    return PRODUCTS.find((product) => product.id === String(id));
  }

  // The lowest-priced item is free for every group of three; ties favor the most recent pick.
  function getDiwaliOffer(items) {
    const settings = STORE_CONFIG.diwaliOffer || {};
    const buyQuantity = Math.max(1, Math.floor(Number(settings.buyQuantity) || 2));
    const groupSize = buyQuantity + 1;
    const lines = items.map((item) => {
      const product = item.product || findProduct(item.id);
      return product ? { id: product.id, quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)), product } : null;
    }).filter(Boolean);
    const totalQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
    let freeQuantity = settings.active ? Math.floor(totalQuantity / groupSize) : 0;
    let remainingFree = freeQuantity;
    const freeByProduct = new Map();
    const freeItems = [];

    lines.map((item, index) => ({ ...item, cartOrder: index }))
      .sort((a, b) => (a.product.price || STORE_CONFIG.price) - (b.product.price || STORE_CONFIG.price) || b.cartOrder - a.cartOrder)
      .forEach((item) => {
      if (!remainingFree) return;
      const quantity = Math.min(item.quantity, remainingFree);
      freeByProduct.set(item.id, quantity);
      freeItems.push({ product: item.product, quantity });
      remainingFree -= quantity;
    });

    const discountAmount = freeItems.reduce((sum, item) => sum + item.quantity * (item.product.price || STORE_CONFIG.price), 0);
    return {
      active: Boolean(settings.active),
      buyQuantity,
      totalQuantity,
      freeQuantity,
      freeByProduct,
      freeItems,
      discountAmount,
      itemsToNextFree: settings.active ? groupSize - (totalQuantity % groupSize) : 0
    };
  }

  function renderCartPage() {
    const itemsTarget = document.getElementById("cart-items");
    if (!itemsTarget) return;
    const cart = getCart();
    const validCart = cart.filter((item) => findProduct(item.id));
    const lines = validCart.map((item) => ({ ...item, product: findProduct(item.id) }));
    const itemQuantity = lines.reduce((sum, item) => sum + item.quantity, 0);
    const itemSubtotal = lines.reduce((sum, item) => sum + item.quantity * (item.product.price || STORE_CONFIG.price), 0);
    const offer = getDiwaliOffer(lines);
    const subtotal = itemSubtotal - offer.discountAmount;
    const originalSubtotal = lines.reduce((sum, item) => sum + item.quantity * (item.product.originalPrice || STORE_CONFIG.originalPrice || item.product.price || STORE_CONFIG.price), 0);
    const savings = Math.max(0, originalSubtotal - subtotal);
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
    itemsTarget.innerHTML = lines.map(({ id, quantity, product }) => {
      const freeQuantity = offer.freeByProduct.get(product.id) || 0;
      const paidQuantity = quantity - freeQuantity;
      const linePrice = `${paidQuantity ? priceMarkup(product, paidQuantity) : ""}${freeQuantity ? `<span class="diwali-free-chip">${freeQuantity} FREE · DIWALI</span>` : ""}`;
      return `
      <article class="cart-line${freeQuantity ? " diwali-free-line" : ""}" data-reveal>
        <a class="cart-line-image" href="product.html?id=${encodeURIComponent(id)}">${productArtwork(product, `VYBEIN ${escapeHTML(product.name)} perfume bottle with its printed label`, "product-art-cart")}</a>
        <div class="cart-line-copy"><h3><a href="product.html?id=${encodeURIComponent(id)}">${escapeHTML(product.name)}</a></h3><p class="cart-line-inspired">Inspired By ${escapeHTML(product.inspiredBy)}</p><p>${escapeHTML(product.category)}</p>
          <div class="cart-line-controls"><div class="quantity-control" aria-label="Quantity for ${escapeHTML(product.name)}"><button type="button" data-quantity-change="-1" data-product-id="${escapeHTML(id)}" aria-label="Remove one ${escapeHTML(product.name)}" ${quantity <= 1 ? "disabled" : ""}>−</button><span>${quantity}</span><button type="button" data-quantity-change="1" data-product-id="${escapeHTML(id)}" aria-label="Add one ${escapeHTML(product.name)}">+</button></div><button class="remove-item" type="button" data-remove-item="${escapeHTML(id)}">Remove</button></div>
        </div>
        <div class="cart-line-price">${linePrice}</div>
      </article>`;
    }).join("");
    observeRevealElements(itemsTarget);
    if (summary) {
      const offerSummary = offer.active
        ? offer.freeQuantity
          ? `<p class="summary-row diwali-discount-row"><span>Diwali offer · ${offer.freeQuantity} free</span><strong>−${formatPrice(offer.discountAmount)}</strong></p>`
          : `<p class="diwali-offer-progress">Add ${offer.itemsToNextFree} more perfume${offer.itemsToNextFree === 1 ? "" : "s"} to unlock your free Diwali scent.</p>`
        : "";
      summary.innerHTML = `<p class="summary-row"><span>Items (${itemQuantity})</span><strong>${formatPrice(itemSubtotal)}</strong></p>${offerSummary}<p class="summary-row summary-savings"><span>Total saved</span><strong>${formatPrice(savings)}</strong></p><p class="summary-shipping">Delivery charges and timing will be confirmed on WhatsApp.</p><p class="summary-row summary-total"><span>Order total</span><strong>${formatPrice(subtotal)}</strong></p>`;
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
      const offer = getDiwaliOffer(cart);
      const itemSubtotal = cart.reduce((sum, item) => sum + item.quantity * (item.product.price || STORE_CONFIG.price), 0);
      const subtotal = itemSubtotal - offer.discountAmount;
      const orderLines = cart.map((item) => {
        const freeQuantity = offer.freeByProduct.get(item.product.id) || 0;
        const paidQuantity = item.quantity - freeQuantity;
        const lineText = freeQuantity
          ? ` (${paidQuantity ? `${paidQuantity} paid, ` : ""}${freeQuantity} FREE)`
          : "";
        const lineTotal = paidQuantity
          ? formatPrice(paidQuantity * (item.product.price || STORE_CONFIG.price))
          : "FREE · Diwali offer";
        return `• ${item.product.name} × ${item.quantity}${lineText} — ${lineTotal}`;
      }).join("\n");
      const promotionMessage = offer.active
        ? offer.freeQuantity
          ? [`Diwali offer applied: Buy ${offer.buyQuantity}, get 1 FREE.`, `Free perfume(s): ${offer.freeItems.map((item) => `${item.product.name} × ${item.quantity}`).join(", ")}.`, `Diwali discount: −${formatPrice(offer.discountAmount)}.`]
          : [`Diwali offer: Buy ${offer.buyQuantity}, get 1 free. Add ${offer.itemsToNextFree} more perfume${offer.itemsToNextFree === 1 ? "" : "s"} to unlock it.`]
        : [];
      const message = [
        "Hi VYBEIN, I’d like to place this order:",
        "",
        orderLines,
        "",
        ...promotionMessage,
        ...(promotionMessage.length ? [""] : []),
        `Order total: ${formatPrice(subtotal)}`,
        "",
        `Name: ${formData.get("name")}`,
        `Phone: ${formData.get("phone")}`,
        `Delivery address: ${formData.get("address")}`,
        `PIN code: ${formData.get("pincode")}`,
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

  // Let visitors browse every perfume, then spray to open that scent's page.
  function setupFragranceCarousel() {
    const carousel = document.querySelector("[data-fragrance-carousel]");
    if (!carousel || !PRODUCTS.length) return;

    const image = carousel.querySelector("[data-carousel-image]");
    const labelImage = carousel.querySelector("[data-carousel-label]");
    const badge = carousel.querySelector("[data-carousel-badge]");
    const count = carousel.querySelector("[data-carousel-count]");
    const name = carousel.querySelector("[data-carousel-name]");
    const inspiredBy = carousel.querySelector("[data-carousel-inspired]");
    const progress = carousel.querySelector("[data-carousel-progress]");
    const status = carousel.querySelector("[data-carousel-status]");
    const sprayButton = carousel.querySelector("[data-carousel-spray]");
    const sprayLabel = carousel.querySelector("[data-spray-label]");
    let activeIndex = 0;
    let redirectTimer = null;

    function cancelSpray() {
      window.clearTimeout(redirectTimer);
      redirectTimer = null;
      carousel.classList.remove("is-spraying");
      sprayButton.classList.remove("is-spraying");
      sprayLabel.textContent = "Spray & discover";
    }

    function showSlide(index) {
      activeIndex = (index + PRODUCTS.length) % PRODUCTS.length;
      const product = PRODUCTS[activeIndex];
      carousel.classList.add("is-sliding");
      image.src = product.image;
      image.alt = `Illustration of VYBEIN ${product.name}, inspired by ${product.inspiredBy}, perfume bottle with its printed label`;
      // Photos already carry their printed label, so hide the overlay for them.
      if (product.labelImage) {
        labelImage.src = product.labelImage;
        labelImage.hidden = false;
      } else {
        labelImage.src = "";
        labelImage.hidden = true;
      }
      badge.textContent = product.badge;
      count.innerHTML = `${String(activeIndex + 1).padStart(2, "0")} <span aria-hidden="true">/</span> ${String(PRODUCTS.length).padStart(2, "0")}`;
      name.textContent = product.name;
      inspiredBy.textContent = `Inspired By ${product.inspiredBy}`;
      progress.style.width = `${((activeIndex + 1) / PRODUCTS.length) * 100}%`;
      status.textContent = `Perfume ${activeIndex + 1} of ${PRODUCTS.length}: ${product.name}, inspired by ${product.inspiredBy}.`;
      sprayButton.setAttribute("aria-label", `Spray ${product.name}, inspired by ${product.inspiredBy}, and view its product page`);
      window.requestAnimationFrame(() => window.setTimeout(() => carousel.classList.remove("is-sliding"), 40));
    }

    carousel.querySelector("[data-carousel-prev]").addEventListener("click", () => {
      cancelSpray();
      showSlide(activeIndex - 1);
    });
    carousel.querySelector("[data-carousel-next]").addEventListener("click", () => {
      cancelSpray();
      showSlide(activeIndex + 1);
    });
    sprayButton.addEventListener("click", () => {
      if (redirectTimer) return;
      const product = PRODUCTS[activeIndex];
      carousel.classList.add("is-spraying");
      sprayButton.classList.add("is-spraying");
      sprayLabel.textContent = "Opening scent…";
      status.textContent = `A mist of ${product.name}. Opening its product page.`;
      redirectTimer = window.setTimeout(() => {
        window.location.href = `product.html?id=${encodeURIComponent(product.id)}`;
      }, 680);
    });

    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        cancelSpray();
        showSlide(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        cancelSpray();
        showSlide(activeIndex + 1);
      }
    });

    showSlide(activeIndex);
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

  // The campaign flag in products.js controls both the shop banner and cart promotion.
  function setupDiwaliPromotion() {
    document.querySelectorAll("[data-diwali-banner]").forEach((banner) => {
      if (!STORE_CONFIG.diwaliOffer?.active) banner.hidden = true;
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
      text: `${product.mood} Explore it for ${formatPrice(product.price || STORE_CONFIG.price)}.`,
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
    setupFragranceCarousel();
    setupDiwaliPromotion();
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
