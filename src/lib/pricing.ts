import { PRODUCTS, STORE, type Product } from "../data/products";

export const formatPrice = (amount: number) =>
  `Rs. ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amount)}`;

export function offerIsLive(now = Date.now()) {
  const { active, endsAt } = STORE.diwaliOffer;
  return active && (!endsAt || now < Date.parse(endsAt));
}

export interface CartLine {
  id: string;
  quantity: number;
}

export interface PricedLine extends CartLine {
  product: Product;
}

export function priceLines(cart: CartLine[]): PricedLine[] {
  return cart.flatMap((line) => {
    const product = PRODUCTS.find((item) => item.id === line.id);
    return product ? [{ ...line, product }] : [];
  });
}

// The lowest-priced bottle in every group of (buyQuantity + 1) is free; ties favour the latest pick.
export function getOffer(lines: PricedLine[]) {
  const active = offerIsLive();
  const buyQuantity = Math.max(1, Math.floor(STORE.diwaliOffer.buyQuantity) || 2);
  const groupSize = buyQuantity + 1;
  const totalQuantity = lines.reduce((sum, line) => sum + line.quantity, 0);
  const freeQuantity = active ? Math.floor(totalQuantity / groupSize) : 0;
  let remaining = freeQuantity;
  const freeByProduct = new Map<string, number>();
  const freeItems: { product: Product; quantity: number }[] = [];

  lines
    .map((line, index) => ({ ...line, index }))
    .sort((a, b) => a.product.price - b.product.price || b.index - a.index)
    .forEach((line) => {
      if (!remaining) return;
      const quantity = Math.min(line.quantity, remaining);
      freeByProduct.set(line.id, quantity);
      freeItems.push({ product: line.product, quantity });
      remaining -= quantity;
    });

  return {
    active,
    buyQuantity,
    totalQuantity,
    freeQuantity,
    freeByProduct,
    freeItems,
    discountAmount: freeItems.reduce((sum, item) => sum + item.quantity * item.product.price, 0),
    itemsToNextFree: active ? groupSize - (totalQuantity % groupSize) : 0
  };
}

export function totals(lines: PricedLine[]) {
  const offer = getOffer(lines);
  const itemSubtotal = lines.reduce((sum, line) => sum + line.quantity * line.product.price, 0);
  const originalSubtotal = lines.reduce((sum, line) => sum + line.quantity * (line.product.originalPrice || line.product.price), 0);
  const total = itemSubtotal - offer.discountAmount;
  return {
    offer,
    itemQuantity: offer.totalQuantity,
    itemSubtotal,
    total,
    savings: Math.max(0, originalSubtotal - total)
  };
}
