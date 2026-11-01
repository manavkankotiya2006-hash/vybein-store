# VYBEIN

A simple static storefront for VYBEIN unisex perfumes. It uses plain HTML, CSS, and JavaScript, so there is nothing to install or build.

## Preview

Open `index.html` in a browser. The shop, product pages, cart, and contact page work as a static website.

## Project files

- `index.html` — home page
- `shop.html` — all perfumes and scent filters
- `product.html` — product details, selected with a URL such as `product.html?id=1`
- `cart.html` — saved cart, order summary, and WhatsApp checkout
- `about.html` and `contact.html` — brand and contact information
- `css/style.css` — site styles
- `js/main.js` — cart, menu, filters, and WhatsApp forms
- `js/products.js` — editable products and store settings
- `images/` — local illustrations and placeholders

## Editing the products

Update each product's label code, `inspiredBy`, category, notes, mood, description, sale price, original price, badge, and image path in `js/products.js`. Put product photos in `images/` and point each product's `image` value to its file.

## Orders and launch details

The cart is saved in the customer's browser. Checkout opens WhatsApp with the order and delivery details; payment is arranged in that chat. The site currently uses bottle illustrations; replace them with the real product photos when ready. The QR image is a non-scannable placeholder. Replace the UPI placeholder if you plan to show an ID. The live domain is `vybein.shop`.

## Diwali offer

The homepage and shop banners, automatic “buy 2, get 1 free” cart discount, and WhatsApp order details share one setting in `js/products.js`. After Diwali, set `STORE_CONFIG.diwaliOffer.active` to `false`. This hides both banners and turns off the discount. The three fragrance education guides are on the home page.
