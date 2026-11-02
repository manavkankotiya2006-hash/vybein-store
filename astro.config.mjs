// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://vybein.shop",
  // Emit shop.html, cart.html, ... so links shared before the redesign keep working.
  build: { format: "file" },
  // Fetch a page as soon as a visitor hovers or touches its link, so it opens instantly.
  prefetch: { prefetchAll: true, defaultStrategy: "hover" },
  devToolbar: { enabled: false }
});
