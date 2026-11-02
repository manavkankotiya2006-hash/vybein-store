// The bag lives in the visitor's browser. The key is unchanged from the old site so saved bags carry over.
import { PRODUCTS } from "../data/products";
import type { CartLine } from "../lib/pricing";

const CART_KEY = "vybein-cart-v1";
export const CART_EVENT = "vybein:cart";

export function getCart(): CartLine[] {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    if (!Array.isArray(stored)) return [];
    const lines = new Map<string, number>();
    stored.forEach((item) => {
      const id = String(item?.id);
      if (!PRODUCTS.some((product) => product.id === id)) return;
      const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
      lines.set(id, (lines.get(id) || 0) + quantity);
    });
    return [...lines].map(([id, quantity]) => ({ id, quantity }));
  } catch {
    return [];
  }
}

export function saveCart(cart: CartLine[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    return false;
  }
  window.dispatchEvent(new CustomEvent(CART_EVENT));
  return true;
}

export function addToCart(id: string, quantity = 1) {
  const cart = getCart();
  const line = cart.find((item) => item.id === id);
  if (line) line.quantity += quantity;
  else cart.push({ id, quantity });
  return saveCart(cart);
}

export function setQuantity(id: string, quantity: number) {
  return saveCart(getCart().map((item) => (item.id === id ? { ...item, quantity: Math.max(1, quantity) } : item)));
}

export function removeFromCart(id: string) {
  return saveCart(getCart().filter((item) => item.id !== id));
}

export const cartCount = () => getCart().reduce((sum, item) => sum + item.quantity, 0);

// Keep other open tabs in step.
window.addEventListener("storage", (event) => {
  if (event.key === CART_KEY) window.dispatchEvent(new CustomEvent(CART_EVENT));
});
