# Connect VYBEIN's private admin

The storefront remains a static GitHub Pages site. Supabase provides the private sign-in and database for the owner panel, product catalog, inventory, and saved orders.

The website uses a **publishable key** in the browser. That key is designed to be public; database policies in `supabase/schema.sql` protect customer orders and stock. Never put a Supabase **secret/service-role key** in this project or share it in chat.

## 1. Create a Supabase project

Create a Supabase account and a new project from the Supabase Dashboard. Choose an email account you control for the owner. Set a new, strong password directly in Supabase. Do not reuse a password that has been shared in chat.

## 2. Create the store tables and security rules

1. In your Supabase project, open **SQL Editor** and choose **New query**.
2. Open `supabase/schema.sql` in this project, copy its full contents, paste them into the query, and click **Run**.
3. The script creates the eight current perfume listings, order and inventory tables, owner-only policies, and the order-saving function. Initial stock is blank (not tracked) until you set the real counts in the admin panel.

Do not continue if the SQL Editor shows an error. Save the error text, but never share database passwords or secret keys.

## 3. Add your owner account

1. In Supabase, open **Authentication → Users** and invite the email address you want to use as the only VYBEIN admin.
2. Open the invitation email and finish setting up that account and its password.
3. In **SQL Editor**, run this query after replacing the example email with your owner email:

```sql
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('you@example.com')
on conflict (user_id) do nothing;
```

Only a user whose ID is in `admin_users` can read orders, see stock counts, or edit listings. The site has no public sign-up form.

## 4. Connect the website

1. In the Supabase project, open **Project Settings → API** (or the project's **Connect** panel).
2. Copy the **Project URL** and the **Publishable key** (older projects may call this the `anon` public key).
3. Put those two values in `js/backend-config.js`:

```js
window.VYBEIN_SUPABASE_CONFIG = {
  url: "YOUR_PROJECT_URL",
  publishableKey: "YOUR_PUBLISHABLE_KEY"
};
```

This publishable key is meant for the browser. Do not copy a key named **secret** or **service_role** into the website.

In **Authentication → URL Configuration**, set the Site URL to `https://vybein.shop` and allow `https://vybein.shop/admin.html` as a redirect URL for the invitation flow.

## 5. Use the admin panel

After the website is deployed, open [https://vybein.shop/admin.html](https://vybein.shop/admin.html) and sign in with the invited owner account.

- **Orders:** review customer contact and delivery details, perfume lines, offer discount, and total; update order and payment status; add private notes; contact the customer on WhatsApp.
- **Listings & stock:** edit perfume details, prices, images, and stock; archive a listing or add a new one. Image paths can point to files in `images/` or to a public image URL.
- **Inventory:** enter each real stock count before using stock reservation. Confirming an order reserves tracked items. Cancelling a confirmed order returns the reserved quantities. Blank stock means the quantity is not tracked.
- **Store offer:** enable or disable Buy 2, Get 1 Free and adjust the buy quantity. The database calculates the order discount when saving the order.

Checkout saves an order to Supabase before opening WhatsApp. If saving fails, the site stays on the cart and asks the customer to retry; it does not open WhatsApp with an unsaved order.

## Security notes

- The admin URL is not the security boundary; Supabase sign-in and row policies are. Guessing `/admin.html` does not grant access.
- Customer names, phone numbers, and addresses are not readable by signed-out visitors. The public catalog API does not grant access to stock counts.
- The database stores orders only after the customer submits checkout. Chats or orders placed outside this website are not imported automatically.
- The website does not collect card or UPI credentials. Payment is still arranged directly with you in WhatsApp.
