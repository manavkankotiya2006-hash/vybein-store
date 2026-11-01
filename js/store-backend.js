/* Secure database connection shared by the storefront and the owner panel. */
(function () {
  const config = window.VYBEIN_SUPABASE_CONFIG || {};
  const sdk = window.supabase;
  const isConfigured = Boolean(config.url && config.publishableKey && sdk?.createClient);
  const client = isConfigured
    ? sdk.createClient(config.url, config.publishableKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      })
    : null;

  function toStoreProduct(row) {
    return {
      id: String(row.id),
      name: row.name,
      inspiredBy: row.inspired_by,
      price: Number(row.price),
      originalPrice: Number(row.original_price),
      category: row.category,
      mood: row.mood,
      notes: Array.isArray(row.notes) ? row.notes : [],
      description: row.description,
      image: row.image_url,
      badge: row.badge,
      stock: row.stock,
      active: row.is_active,
      sortOrder: row.sort_order
    };
  }

  async function loadCatalog() {
    if (!client) return false;

    const [catalogResult, settingsResult] = await Promise.all([
      client.from("products")
        .select("id,name,inspired_by,price,original_price,category,mood,notes,description,image_url,badge,is_active,sort_order")
        .order("sort_order").order("name"),
      client.from("store_settings").select("diwali_offer_active,buy_quantity").eq("id", true).maybeSingle()
    ]);

    if (catalogResult.error) {
      console.error("Could not load the online VYBEIN catalog:", catalogResult.error.message);
      return false;
    }

    const onlineProducts = (catalogResult.data || []).map(toStoreProduct);
    PRODUCTS.splice(0, PRODUCTS.length, ...onlineProducts);
    if (settingsResult.data && typeof STORE_CONFIG !== "undefined") {
      STORE_CONFIG.diwaliOffer.active = Boolean(settingsResult.data.diwali_offer_active);
      STORE_CONFIG.diwaliOffer.buyQuantity = Number(settingsResult.data.buy_quantity) || 2;
    }
    window.dispatchEvent(new CustomEvent("vybein:catalog-loaded"));
    return true;
  }

  async function placeOrder(order) {
    if (!client) throw new Error("Online order storage is not configured yet.");
    const { data, error } = await client.rpc("place_order", {
      p_customer_name: order.name,
      p_phone: order.phone,
      p_address: order.address,
      p_pincode: order.pincode,
      p_items: order.items
    });
    if (error) throw error;
    return data;
  }

  window.VYBEIN_BACKEND = {
    client,
    configured: isConfigured,
    loadCatalog,
    placeOrder
  };
})();
