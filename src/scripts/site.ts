/*
  Behaviour shared by every page: smooth scrolling, the header and menu,
  scroll reveals, the bag counter, "Add to bag" buttons and the toast.
*/
import Lenis from "lenis";
import { PRODUCTS } from "../data/products";
import { getOffer, offerIsLive, priceLines } from "../lib/pricing";
import { CART_EVENT, addToCart, cartCount, getCart } from "./cart";

export const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Smooth, weighted scrolling on desktop; touch devices keep native scrolling.
export const lenis = reducedMotion ? null : new Lenis({ autoRaf: true, lerp: 0.09, wheelMultiplier: 0.95 });

/* ---------- Header ---------- */
const masthead = document.querySelector<HTMLElement>("[data-masthead]");
const announce = masthead?.querySelector<HTMLElement>(".announce");
if (masthead) {
  const setHeight = () => masthead.style.setProperty("--announce-height", `${announce?.offsetHeight || 0}px`);
  const update = () => masthead.classList.toggle("is-scrolled", window.scrollY > 24);
  setHeight();
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", setHeight);
}

/* ---------- Menu ---------- */
const menuButton = document.querySelector<HTMLButtonElement>("[data-menu-button]");
const menuPanel = document.querySelector<HTMLElement>("[data-menu-panel]");
function setMenu(open: boolean) {
  if (!menuButton) return;
  document.documentElement.classList.toggle("menu-open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  if (open) lenis?.stop();
  else lenis?.start();
}
menuButton?.addEventListener("click", () => setMenu(menuButton.getAttribute("aria-expanded") !== "true"));
menuPanel?.addEventListener("click", (event) => {
  if ((event.target as Element).closest("a")) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && document.documentElement.classList.contains("menu-open")) {
    setMenu(false);
    menuButton?.focus();
  }
});

/* ---------- Reveal on scroll ---------- */
const revealObserver = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      revealObserver?.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" })
  : null;

export function observeReveals(root: ParentNode = document) {
  root.querySelectorAll("[data-reveal]:not(.is-in)").forEach((element) => {
    if (revealObserver) revealObserver.observe(element);
    else element.classList.add("is-in");
  });
}
observeReveals();

/* ---------- Toast ---------- */
const toast = document.querySelector<HTMLElement>("[data-toast]");
let toastTimer = 0;
export function showToast(message: string, link?: { href: string; label: string }) {
  if (!toast) return;
  toast.replaceChildren(document.createTextNode(message));
  if (link) {
    const anchor = document.createElement("a");
    anchor.href = link.href;
    anchor.textContent = link.label;
    toast.append(anchor);
  }
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

/* ---------- Bag counter ---------- */
function updateBagCount(bump = false) {
  const count = cartCount();
  document.querySelectorAll<HTMLElement>("[data-cart-count]").forEach((badge) => {
    badge.textContent = String(count);
    badge.setAttribute("aria-label", `${count} ${count === 1 ? "item" : "items"} in bag`);
    if (bump) {
      badge.classList.remove("is-bumped");
      void badge.offsetWidth;
      badge.classList.add("is-bumped");
    }
  });
}
updateBagCount();
window.addEventListener(CART_EVENT, () => updateBagCount(true));
// Pages restored from the back/forward cache may show a stale count.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) updateBagCount();
});

/* ---------- Add to bag ---------- */
document.addEventListener("click", (event) => {
  const button = (event.target as Element).closest<HTMLElement>("[data-add-to-cart]");
  if (!button) return;
  const product = PRODUCTS.find((item) => item.id === button.dataset.addToCart);
  if (!product) return;
  const before = getOffer(priceLines(getCart())).freeQuantity;
  if (!addToCart(product.id)) {
    showToast("Your browser is blocking saved bags. Message us on WhatsApp to order.");
    return;
  }
  button.classList.remove("is-added");
  void button.offsetWidth;
  button.classList.add("is-added");

  const offer = getOffer(priceLines(getCart()));
  const bagLink = { href: "/cart", label: "View bag" };
  if (!offer.active) showToast(`${product.code} has been added to your bag.`, bagLink);
  else if (offer.freeQuantity > before) showToast(`Diwali gift unlocked — ${offer.freeQuantity} bottle${offer.freeQuantity === 1 ? "" : "s"} on us.`, bagLink);
  else showToast(`${product.code} added. ${offer.itemsToNextFree} more for your Diwali gift.`, bagLink);
});

/* ---------- Seasonal banners ---------- */
// Banners are written at build time, so hide them here once an end date passes.
if (!offerIsLive()) {
  document.querySelectorAll<HTMLElement>("[data-diwali-banner]").forEach((banner) => { banner.hidden = true; });
}
