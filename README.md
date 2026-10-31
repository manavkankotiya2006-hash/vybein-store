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

Update names, prices, fragrance notes, descriptions, and image paths in `js/products.js`. Put replacement product photos in `images/` and point each product's `image` value to its file.

## Orders and launch details

The cart is saved in the customer's browser. Checkout opens WhatsApp with the order and delivery details; payment is arranged in that chat. Replace the sample product artwork with the real bottle photos before launch. The QR image is a non-scannable placeholder. Replace the UPI placeholder if you plan to show an ID, and replace `your-domain.com` in the Open Graph tags in the HTML files with your domain.
