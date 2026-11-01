/* Owner-only VYBEIN dashboard. Database access is enforced by Supabase RLS too. */
(function () {
  const backend = window.VYBEIN_BACKEND;
  const loginCard = document.getElementById("admin-login");
  const dashboard = document.getElementById("admin-dashboard");
  const loginForm = document.getElementById("admin-login-form");
  const loginMessage = document.getElementById("admin-message");
  const signOutButton = document.getElementById("admin-signout");
  const dashboardMessage = document.getElementById("dashboard-message");
  const ordersTarget = document.getElementById("admin-orders");
  const productsTarget = document.getElementById("admin-products");
  const pageSize = 50;
  let orderOffset = 0;
  let orderCount = 0;

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[character]);
  }

  function setMessage(target, message, kind = "") {
    if (!target) return;
    target.textContent = message;
    target.dataset.kind = kind;
  }

  function formatRupees(value) {
    return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value) || 0)}`;
  }

  function formatDate(value) {
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? "Date unavailable"
      : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(date);
  }

  if (!backend?.configured) {
    loginForm.hidden = true;
    setMessage(loginMessage, "The secure database is not connected yet. Follow SUPABASE_SETUP.md to connect the private admin.");
    return;
  }

  const client = backend.client;

  async function checkOwnerAccess(user) {
    const { data, error } = await client
      .from("admin_users")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      await client.auth.signOut();
      loginCard.hidden = false;
      dashboard.hidden = true;
      signOutButton.hidden = true;
      setMessage(loginMessage, "This account does not have VYBEIN owner access.");
      return false;
    }

    loginCard.hidden = true;
    dashboard.hidden = false;
    signOutButton.hidden = false;
    document.getElementById("admin-owner-email").textContent = user.email || "Owner account";
    await loadDashboard();
    return true;
  }

  async function handleLogin(event) {
    event.preventDefault();
    if (!loginForm.reportValidity()) return;
    const button = loginForm.querySelector('[type="submit"]');
    button.disabled = true;
    button.textContent = "Signing in…";
    setMessage(loginMessage, "");

    const formData = new FormData(loginForm);
    const { data, error } = await client.auth.signInWithPassword({
      email: String(formData.get("email") || "").trim(),
      password: String(formData.get("password") || "")
    });

    button.disabled = false;
    button.textContent = "Sign in securely";
    if (error || !data.user) {
      setMessage(loginMessage, "Sign-in failed. Check the owner email and password, then try again.");
      return;
    }
    await checkOwnerAccess(data.user);
    loginForm.reset();
  }

  async function loadDashboard() {
    setMessage(dashboardMessage, "Loading private store data…");
    await Promise.all([loadOrders(), loadProducts(), loadSettings(), loadStats()]);
    setMessage(dashboardMessage, "Your private store data is up to date.", "success");
  }

  async function loadOrders() {
    const { data, error, count } = await client
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(orderOffset, orderOffset + pageSize - 1);

    if (error) {
      ordersTarget.innerHTML = '<p class="admin-empty">Could not load orders. Check the database setup and access rules.</p>';
      setMessage(dashboardMessage, "Could not load orders. Verify the database setup.");
      return;
    }

    orderCount = count || 0;
    document.getElementById("admin-order-count").textContent = `${orderCount} total`;
    document.getElementById("orders-page-label").textContent = orderCount
      ? `Showing ${orderOffset + 1}–${Math.min(orderOffset + pageSize, orderCount)} of ${orderCount}`
      : "No orders yet";
    document.getElementById("orders-previous").disabled = orderOffset === 0;
    document.getElementById("orders-next").disabled = orderOffset + pageSize >= orderCount;

    if (!data?.length) {
      ordersTarget.innerHTML = '<p class="admin-empty">No orders have been saved yet. New checkout orders will appear here.</p>';
      return;
    }

    ordersTarget.innerHTML = data.map(orderCard).join("");
  }

  function orderCard(order) {
    const statusOptions = ["new", "confirmed", "packing", "shipped", "completed", "cancelled"];
    const paymentOptions = ["unpaid", "proof_received", "paid", "refunded"];
    const items = Array.isArray(order.items) ? order.items : [];
    const phoneDigits = String(order.phone || "").replace(/\D/g, "");
    const whatsapp = phoneDigits
      ? `<a class="admin-button" href="https://wa.me/91${escapeHTML(phoneDigits)}?text=${encodeURIComponent(`Hi ${order.customer_name || ""}, regarding VYBEIN order ${order.order_ref}.`)}" target="_blank" rel="noopener">WhatsApp customer</a>`
      : "";

    return `
      <article class="admin-order-card" data-order-card="${escapeHTML(order.id)}">
        <div class="admin-order-header">
          <div><span class="admin-order-ref">${escapeHTML(order.order_ref)}</span><time class="admin-order-date">${escapeHTML(formatDate(order.created_at))}</time></div>
          <strong class="admin-order-total">${formatRupees(order.total)}</strong>
        </div>
        <div class="admin-order-details">
          <div><h3>Customer</h3><p>${escapeHTML(order.customer_name)}</p><p><a href="tel:${escapeHTML(phoneDigits)}">${escapeHTML(order.phone)}</a></p><p>${escapeHTML(order.delivery_address)}</p><p>PIN code: ${escapeHTML(order.pincode)}</p></div>
          <div><h3>Perfumes</h3><ul>${items.map((item) => `<li>${escapeHTML(item.name)} × ${Number(item.quantity) || 0}${Number(item.free_quantity) ? ` · ${Number(item.free_quantity)} free` : ""} — ${formatRupees((Number(item.quantity) - Number(item.free_quantity || 0)) * Number(item.unit_price || 0))}</li>`).join("")}</ul><p>Items: ${formatRupees(order.subtotal)} · Discount: ${formatRupees(order.discount)}</p></div>
        </div>
        <div class="admin-order-controls">
          <label>Order status<select data-order-status>${statusOptions.map((status) => `<option value="${status}"${order.status === status ? " selected" : ""}>${status.replaceAll("_", " ")}</option>`).join("")}</select></label>
          <label>Payment status<select data-payment-status>${paymentOptions.map((status) => `<option value="${status}"${order.payment_status === status ? " selected" : ""}>${status.replaceAll("_", " ")}</option>`).join("")}</select></label>
          <label class="admin-wide-field">Private owner note<textarea data-order-notes rows="2">${escapeHTML(order.admin_notes)}</textarea></label>
          <div class="admin-order-actions"><button class="admin-button admin-button-primary" type="button" data-save-order="${escapeHTML(order.id)}">Save order update</button>${whatsapp}<span class="admin-message-inline" aria-live="polite"></span></div>
        </div>
      </article>`;
  }

  async function loadProducts() {
    const { data, error } = await client.rpc("admin_list_products");
    if (error) {
      productsTarget.innerHTML = '<p class="admin-empty">Could not load listings. Verify the owner database policies.</p>';
      setMessage(dashboardMessage, "Could not load product inventory.");
      return;
    }
    productsTarget.innerHTML = (data || []).map(productEditor).join("");
    updateStats((data || []).length, data || []);
  }

  function productEditor(product) {
    const currentStock = product.stock == null ? "" : product.stock;
    const stockLabel = product.stock == null ? "Stock not tracked" : `${product.stock} in stock`;
    return `
      <details class="admin-product-card" data-product-card="${escapeHTML(product.id)}">
        <summary><span><strong>${escapeHTML(product.name)} · ${escapeHTML(product.inspired_by)}</strong><small>${escapeHTML(product.category)} · ${escapeHTML(product.badge)}</small></span><span class="admin-product-stock">${escapeHTML(stockLabel)}${product.is_active ? " · Active" : " · Archived"}</span></summary>
        <form class="admin-product-form" data-product-form>
          <div class="admin-product-grid">
            <label>Product ID<input name="id" value="${escapeHTML(product.id)}" required></label>
            <label>Label code<input name="name" value="${escapeHTML(product.name)}" required></label>
            <label>Inspired by<input name="inspired_by" value="${escapeHTML(product.inspired_by)}" required></label>
            <label>Sale price (₹)<input name="price" type="number" min="0" step="1" value="${escapeHTML(product.price)}" required></label>
            <label>Original price (₹)<input name="original_price" type="number" min="0" step="1" value="${escapeHTML(product.original_price)}" required></label>
            <label>Stock count<input name="stock" type="number" min="0" step="1" value="${escapeHTML(currentStock)}" placeholder="Blank = not tracked"></label>
            <label>Category<input name="category" value="${escapeHTML(product.category)}" required></label>
            <label>Badge<input name="badge" value="${escapeHTML(product.badge)}"></label>
            <label>Display order<input name="sort_order" type="number" step="1" value="${escapeHTML(product.sort_order)}"></label>
            <label class="admin-wide-field">Image path or public URL<input name="image_url" value="${escapeHTML(product.image_url)}" required><small>For example: images/my-perfume.jpg</small></label>
            <label class="admin-wide-field">Fragrance notes, separated by commas<input name="notes" value="${escapeHTML(Array.isArray(product.notes) ? product.notes.join(", ") : "")}"></label>
            <label class="admin-wide-field">Mood line<input name="mood" value="${escapeHTML(product.mood)}"></label>
            <label class="admin-wide-field">Description<textarea name="description" rows="3">${escapeHTML(product.description)}</textarea></label>
            <label class="admin-inline-check admin-wide-field"><input name="is_active" type="checkbox"${product.is_active ? " checked" : ""}> Show this perfume in the public shop</label>
          </div>
          <div class="admin-order-actions"><button class="admin-button admin-button-primary" type="submit">Save listing & stock</button><button class="admin-button" type="button" data-archive-product>Archive listing</button><span class="admin-message-inline" aria-live="polite"></span></div>
        </form>
      </details>`;
  }

  function updateStats(orderCountValue, products) {
    const trackedLow = products.filter((product) => product.stock != null && Number(product.stock) <= 5).length;
    const pendingPlaceholder = document.getElementById("admin-stats");
    const values = [
      ["All orders", document.getElementById("admin-order-count").textContent.replace(" total", "") || "0"],
      ["Perfume listings", orderCountValue],
      ["Low stock (5 or less)", trackedLow],
      ["Untracked stock", products.filter((product) => product.stock == null).length]
    ];
    pendingPlaceholder.innerHTML = values.map(([label, value]) => `<div class="admin-stat-card"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>`).join("");
  }

  async function loadStats() {
    const [{ count: totalOrders }, { count: newOrders }] = await Promise.all([
      client.from("orders").select("id", { count: "exact", head: true }),
      client.from("orders").select("id", { count: "exact", head: true }).eq("status", "new")
    ]);
    const stats = document.getElementById("admin-stats");
    const current = Array.from(stats.querySelectorAll(".admin-stat-card"));
    if (current.length) {
      current[0].querySelector("strong").textContent = String(totalOrders || 0);
      current[0].setAttribute("aria-label", `${totalOrders || 0} orders, ${newOrders || 0} new`);
    }
  }

  async function loadSettings() {
    const { data, error } = await client
      .from("store_settings")
      .select("diwali_offer_active,buy_quantity")
      .eq("id", true)
      .maybeSingle();
    if (error || !data) return;
    const form = document.getElementById("admin-settings-form");
    form.elements.diwali_offer_active.checked = data.diwali_offer_active;
    form.elements.buy_quantity.value = data.buy_quantity;
  }

  async function saveOrder(button) {
    const card = button.closest("[data-order-card]");
    const message = card.querySelector(".admin-message-inline");
    const orderId = button.dataset.saveOrder;
    button.disabled = true;
    message.textContent = "Saving…";
    const { error } = await client.from("orders").update({
      status: card.querySelector("[data-order-status]").value,
      payment_status: card.querySelector("[data-payment-status]").value,
      admin_notes: card.querySelector("[data-order-notes]").value.trim()
    }).eq("id", orderId);
    button.disabled = false;
    message.textContent = error ? "Could not save. Check the connection." : "Saved.";
    if (!error) await Promise.all([loadOrders(), loadProducts(), loadStats()]);
  }

  async function saveProduct(form) {
    const button = form.querySelector('[type="submit"]');
    const message = form.querySelector(".admin-message-inline");
    const values = new FormData(form);
    const notes = String(values.get("notes") || "").split(",").map((note) => note.trim()).filter(Boolean);
    const stockText = String(values.get("stock") || "").trim();
    const row = {
      id: String(values.get("id") || "").trim(),
      name: String(values.get("name") || "").trim(),
      inspired_by: String(values.get("inspired_by") || "").trim(),
      price: Number(values.get("price")),
      original_price: Number(values.get("original_price")),
      category: String(values.get("category") || "").trim(),
      mood: String(values.get("mood") || "").trim(),
      notes,
      description: String(values.get("description") || "").trim(),
      image_url: String(values.get("image_url") || "").trim(),
      badge: String(values.get("badge") || "").trim(),
      stock: stockText === "" ? null : Number(stockText),
      is_active: form.elements.is_active.checked,
      sort_order: Number(values.get("sort_order")) || 0,
      updated_at: new Date().toISOString()
    };

    button.disabled = true;
    message.textContent = "Saving…";
    const { error } = await client.from("products").upsert(row);
    button.disabled = false;
    if (error) {
      message.textContent = "Could not save. Check that the ID is unique and every required field is complete.";
      return;
    }
    message.textContent = "Saved. The public shop will use this listing when refreshed.";
    await Promise.all([loadProducts(), backend.loadCatalog()]);
  }

  async function saveSettings(event) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    const { error } = await client.from("store_settings").update({
      diwali_offer_active: form.elements.diwali_offer_active.checked,
      buy_quantity: Number(form.elements.buy_quantity.value),
      updated_at: new Date().toISOString()
    }).eq("id", true);
    button.disabled = false;
    setMessage(dashboardMessage, error ? "Could not save the offer setting." : "Offer settings saved.", error ? "error" : "success");
    if (!error) await backend.loadCatalog();
  }

  function productBlankEditor() {
    return productEditor({
      id: "", name: "", inspired_by: "", price: 899, original_price: 1299,
      category: "", mood: "", notes: [], description: "", image_url: "",
      badge: "", stock: null, is_active: true, sort_order: 0
    }).replace("<details class=\"admin-product-card\"", "<details open class=\"admin-product-card\"");
  }

  function setActiveSection(name) {
    document.querySelectorAll("[data-admin-tab]").forEach((tab) => {
      const active = tab.dataset.adminTab === name;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-current", active ? "page" : "false");
    });
    document.querySelectorAll(".admin-section").forEach((section) => {
      section.hidden = section.id !== `admin-${name}-section`;
    });
  }

  loginForm.addEventListener("submit", handleLogin);
  signOutButton.addEventListener("click", async () => {
    await client.auth.signOut();
    dashboard.hidden = true;
    loginCard.hidden = false;
    signOutButton.hidden = true;
    setMessage(loginMessage, "You have signed out.", "success");
  });

  document.getElementById("admin-refresh").addEventListener("click", loadDashboard);
  document.querySelectorAll("[data-admin-tab]").forEach((tab) => {
    tab.addEventListener("click", () => setActiveSection(tab.dataset.adminTab));
  });
  document.getElementById("orders-previous").addEventListener("click", async () => {
    orderOffset = Math.max(0, orderOffset - pageSize);
    await loadOrders();
  });
  document.getElementById("orders-next").addEventListener("click", async () => {
    if (orderOffset + pageSize >= orderCount) return;
    orderOffset += pageSize;
    await loadOrders();
  });
  document.getElementById("add-product").addEventListener("click", () => {
    productsTarget.insertAdjacentHTML("afterbegin", productBlankEditor());
    productsTarget.querySelector("details").scrollIntoView({ behavior: "smooth", block: "center" });
    productsTarget.querySelector('details[open] input[name="id"]').focus();
  });
  ordersTarget.addEventListener("click", (event) => {
    const button = event.target.closest("[data-save-order]");
    if (button) saveOrder(button);
  });
  productsTarget.addEventListener("submit", (event) => {
    const form = event.target.closest("[data-product-form]");
    if (!form) return;
    event.preventDefault();
    if (form.reportValidity()) saveProduct(form);
  });
  productsTarget.addEventListener("click", (event) => {
    const archiveButton = event.target.closest("[data-archive-product]");
    if (!archiveButton) return;
    const form = archiveButton.closest("[data-product-form]");
    form.elements.is_active.checked = false;
    saveProduct(form);
  });
  document.getElementById("admin-settings-form").addEventListener("submit", saveSettings);

  async function restoreSession() {
    const { data } = await client.auth.getSession();
    if (data.session?.user) await checkOwnerAccess(data.session.user);
  }

  client.auth.onAuthStateChange((_event, session) => {
    if (!session?.user && !dashboard.hidden) {
      dashboard.hidden = true;
      loginCard.hidden = false;
      signOutButton.hidden = true;
    }
  });

  restoreSession();
})();
