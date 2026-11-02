// Build-time image lookup. Astro resizes and converts these, so originals can stay large.
import type { ImageMetadata } from "astro";

const files = import.meta.glob<{ default: ImageMetadata }>("../assets/products/*.webp", { eager: true });

function find(name: string) {
  const entry = Object.entries(files).find(([path]) => path.endsWith(`/${name}.webp`));
  if (!entry) throw new Error(`Missing product image: ${name}.webp`);
  return entry[1].default;
}

export const productPhoto = (code: string) => find(`${code}-main`);
export const heroPhoto = () => find("L-KHM-hero");
