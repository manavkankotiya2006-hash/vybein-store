-- VYBEIN secure store database
-- Run this file once in Supabase Dashboard > SQL Editor.

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  inspired_by text not null default '',
  price numeric(10,2) not null default 899 check (price >= 0),
  original_price numeric(10,2) not null default 1299 check (original_price >= 0),
  category text not null default '',
  mood text not null default '',
  notes text[] not null default '{}',
  description text not null default '',
  image_url text not null default '',
  badge text not null default '',
  stock integer null default null check (stock is null or stock >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id boolean primary key default true check (id),
  diwali_offer_active boolean not null default true,
  buy_quantity integer not null default 2 check (buy_quantity >= 1 and buy_quantity <= 20),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.vybein_order_number_seq;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_ref text not null unique,
  customer_name text not null,
  phone text not null,
  delivery_address text not null,
  pincode text not null,
  items jsonb not null,
  subtotal numeric(10,2) not null check (subtotal >= 0),
  discount numeric(10,2) not null default 0 check (discount >= 0),
  total numeric(10,2) not null check (total >= 0),
  offer_applied text,
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'packing', 'shipped', 'completed', 'cancelled')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'proof_received', 'paid', 'refunded')),
  stock_reserved boolean not null default false,
  admin_notes text not null default '',
  created_at timestamptz not null default now()
);

-- Seed the existing VYBEIN range. Blank stock means inventory is not tracked yet.
insert into public.products
  (id, name, inspired_by, price, original_price, category, mood, notes, description, image_url, badge, sort_order)
values
  ('1', 'L-KHM', 'Khamrah', 899, 1299, 'Warm & Spiced', 'A rich, irresistible warmth made for unforgettable nights.', array['Cinnamon','Dates','Vanilla','Amberwood'], 'An indulgent blend of warm spices, sweet gourmand notes, and smooth vanilla. Deep, inviting, and beautifully comforting, this fragrance leaves a memorable trail wherever the night takes you.', 'images/midnight-bloom.svg', 'Bestseller', 1),
  ('2', 'C-AVT', 'Creed Aventus', 899, 1299, 'Fruity & Woody', 'Confidence has its own signature.', array['Pineapple','Bergamot','Birch','Musk'], 'A bold blend of bright fruits and refined woods, creating a confident and sophisticated character. Fresh at first, smoky in its depth, and effortlessly memorable.', 'images/amber-veil.svg', 'Iconic Fragrance', 2),
  ('3', 'AJ-AW', 'Amber Wood', 899, 1299, 'Warm & Woody', 'A golden warmth that speaks without words.', array['Amber','Woody accords','Musk','Spices'], 'A sophisticated combination of warm amber, smooth woods, and sensual musk. Rich yet balanced, this fragrance wraps you in an elegant trail that feels timeless.', 'images/citrus-muse.svg', 'Rich & Elegant', 3),
  ('4', 'TF-OW', 'Oud Wood', 899, 1299, 'Woody & Spiced', 'Dark woods. Quiet luxury. Timeless presence.', array['Oud','Sandalwood','Cardamom','Vanilla'], 'An elegant woody composition built around precious oud, aromatic spices, and creamy sandalwood. Smooth, mysterious, and refined, it brings understated luxury to every occasion.', 'images/velvet-oud.svg', 'Luxury Collection', 4),
  ('5', 'R-HWS', 'Hawas', 899, 1299, 'Fresh & Aquatic', 'A refreshing rush with an unforgettable finish.', array['Bergamot','Apple','Aquatic accords','Ambergris'], 'An energetic blend of crisp fruits, refreshing aquatic notes, and warm amber undertones. Clean, vibrant, and effortlessly attractive, this fragrance is made for everyday confidence.', 'images/santal-skin.svg', 'Fresh Favourite', 5),
  ('6', 'V-ERS', 'Eros', 899, 1299, 'Fresh & Sweet', 'Made to attract. Remembered for its presence.', array['Mint','Green Apple','Tonka Bean','Vanilla'], 'A striking combination of fresh mint, juicy fruit, and warm vanilla. Playful yet powerful, this fragrance balances freshness and sensual sweetness with a confident finish.', 'images/rose-afterglow.svg', 'Bold & Magnetic', 6),
  ('7', 'D-SVG', 'Sauvage', 899, 1299, 'Fresh & Spicy', 'Wild freshness with a powerful signature.', array['Bergamot','Pepper','Lavender','Ambroxan'], 'A crisp burst of fresh citrus meets aromatic spices and a deep woody-amber finish. Bold, modern, and versatile, it creates a distinctive presence from day to night.', 'images/musk-theory.svg', 'Signature Scent', 7),
  ('8', 'A-SWY', 'Stronger With You', 899, 1299, 'Warm & Gourmand', 'A warm embrace that stays long after goodbye.', array['Cardamom','Pink Pepper','Vanilla','Chestnut accord'], 'A captivating blend of aromatic spices, creamy sweetness, and warm chestnut-inspired notes. Smooth, comforting, and addictive, this fragrance is perfect for memorable evenings.', 'images/golden-hour.svg', 'Addictive Warmth', 8)
on conflict (id) do nothing;

insert into public.store_settings (id, diwali_offer_active, buy_quantity)
values (true, true, 2)
on conflict (id) do nothing;

-- One private helper for all owner-only database policies.
create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_store_admin() from public, anon;
grant execute on function public.is_store_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.products enable row level security;
alter table public.store_settings enable row level security;
alter table public.orders enable row level security;

-- Explicit grants: the public can read the storefront fields, never stock counts or customer orders.
revoke all on public.admin_users from public, anon, authenticated;
grant select on public.admin_users to authenticated;

revoke all on public.products from public, anon, authenticated;
grant select (id, name, inspired_by, price, original_price, category, mood, notes, description, image_url, badge, is_active, sort_order)
  on public.products to anon, authenticated;
grant insert, update on public.products to authenticated;

revoke all on public.store_settings from public, anon, authenticated;
grant select on public.store_settings to anon, authenticated;
grant update on public.store_settings to authenticated;

revoke all on public.orders from public, anon, authenticated;
grant select, update on public.orders to authenticated;

drop policy if exists "owner reads own admin membership" on public.admin_users;
create policy "owner reads own admin membership"
  on public.admin_users for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "public sees active listings" on public.products;
drop policy if exists "signed-in visitors see active listings" on public.products;
drop policy if exists "owner sees all listings" on public.products;
create policy "public sees active listings"
  on public.products for select to anon
  using (is_active);
create policy "signed-in visitors see active listings"
  on public.products for select to authenticated
  using (is_active);
create policy "owner sees all listings"
  on public.products for select to authenticated
  using ((select public.is_store_admin()));

drop policy if exists "owner creates listings" on public.products;
create policy "owner creates listings"
  on public.products for insert to authenticated
  with check ((select public.is_store_admin()));

drop policy if exists "owner edits listings and inventory" on public.products;
create policy "owner edits listings and inventory"
  on public.products for update to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

drop policy if exists "public reads store promotion" on public.store_settings;
create policy "public reads store promotion"
  on public.store_settings for select to anon, authenticated
  using (true);

drop policy if exists "owner updates store promotion" on public.store_settings;
create policy "owner updates store promotion"
  on public.store_settings for update to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

drop policy if exists "owner reads orders" on public.orders;
create policy "owner reads orders"
  on public.orders for select to authenticated
  using ((select public.is_store_admin()));

drop policy if exists "owner updates orders" on public.orders;
create policy "owner updates orders"
  on public.orders for update to authenticated
  using ((select public.is_store_admin()))
  with check ((select public.is_store_admin()));

-- The admin calls this instead of selecting stock through the public product API.
create or replace function public.admin_list_products()
returns setof public.products
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select public.is_store_admin()) then
    raise exception 'Owner access required';
  end if;
  return query
    select * from public.products order by sort_order, name;
end;
$$;

revoke all on function public.admin_list_products() from public, anon;
grant execute on function public.admin_list_products() to authenticated;

-- Public order submission returns only a receipt. Private delivery data stays in the orders table.
create or replace function public.place_order(
  p_customer_name text,
  p_phone text,
  p_address text,
  p_pincode text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_requested_count integer;
  v_processed_count integer := 0;
  v_total_quantity integer := 0;
  v_remaining_free integer := 0;
  v_buy_quantity integer := 2;
  v_offer_active boolean := false;
  v_subtotal numeric(10,2) := 0;
  v_discount numeric(10,2) := 0;
  v_line record;
  v_free_quantity integer;
  v_reserved boolean;
  v_order_items jsonb := '[]'::jsonb;
  v_order_id uuid;
  v_order_ref text;
begin
  if length(trim(coalesce(p_customer_name, ''))) < 2 or length(trim(p_customer_name)) > 120 then
    raise exception 'Please enter a valid full name.';
  end if;
  if coalesce(p_phone, '') !~ '^[0-9]{10}$' then
    raise exception 'Enter a 10-digit mobile number.';
  end if;
  if length(trim(coalesce(p_address, ''))) < 8 or length(trim(p_address)) > 500 then
    raise exception 'Please enter a complete delivery address.';
  end if;
  if coalesce(p_pincode, '') !~ '^[0-9]{6}$' then
    raise exception 'Enter a 6-digit delivery PIN code.';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' then
    raise exception 'Your bag is empty or invalid.';
  end if;
  if jsonb_array_length(p_items) < 1 or jsonb_array_length(p_items) > 30 then
    raise exception 'Your bag is empty or has too many different items.';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_items) as line(value)
    where jsonb_typeof(line.value) is distinct from 'object'
       or coalesce(line.value->>'id', '') = ''
       or coalesce(line.value->>'quantity', '') !~ '^[1-9][0-9]{0,2}$'
       or (line.value->>'quantity')::integer > 50
  ) then
    raise exception 'A product or quantity in your bag is invalid.';
  end if;

  select coalesce(sum((line.value->>'quantity')::integer), 0)
    into v_total_quantity
    from jsonb_array_elements(p_items) as line(value);
  if v_total_quantity > 100 then
    raise exception 'Your order has too many perfumes.';
  end if;

  select diwali_offer_active, buy_quantity
    into v_offer_active, v_buy_quantity
    from public.store_settings where id = true;
  v_offer_active := coalesce(v_offer_active, false);
  v_buy_quantity := greatest(1, coalesce(v_buy_quantity, 2));
  if v_offer_active then
    v_remaining_free := floor(v_total_quantity::numeric / (v_buy_quantity + 1))::integer;
  end if;

  select count(*) into v_requested_count
    from (
      select line.value->>'id'
      from jsonb_array_elements(p_items) as line(value)
      group by line.value->>'id'
    ) requested;

  for v_line in
    select p.id, p.name, p.inspired_by, p.price, p.stock, p.image_url,
           requested.quantity
    from (
      select line.value->>'id' as id,
             sum((line.value->>'quantity')::integer)::integer as quantity
      from jsonb_array_elements(p_items) as line(value)
      group by line.value->>'id'
    ) requested
    join public.products p on p.id = requested.id
    where p.is_active = true
    order by p.price asc, p.id asc
    for update of p
  loop
    v_processed_count := v_processed_count + 1;
    if v_line.stock is not null and v_line.stock < v_line.quantity then
      raise exception 'Only % of % is currently available.', greatest(v_line.stock, 0), v_line.name;
    end if;

    v_free_quantity := least(v_line.quantity, v_remaining_free);
    v_remaining_free := v_remaining_free - v_free_quantity;
    v_subtotal := v_subtotal + (v_line.price * v_line.quantity);
    v_discount := v_discount + (v_line.price * v_free_quantity);
    v_reserved := v_line.stock is not null;

    v_order_items := v_order_items || jsonb_build_array(jsonb_build_object(
      'id', v_line.id,
      'name', v_line.name,
      'inspired_by', v_line.inspired_by,
      'unit_price', v_line.price,
      'quantity', v_line.quantity,
      'free_quantity', v_free_quantity,
      'image_url', v_line.image_url,
      'stock_reserved', v_reserved
    ));
  end loop;

  if v_processed_count <> v_requested_count then
    raise exception 'One or more perfumes are no longer available. Please refresh your bag.';
  end if;

  insert into public.orders (
    order_ref, customer_name, phone, delivery_address, pincode,
    items, subtotal, discount, total, offer_applied, status
  ) values (
    'VY-' || to_char(now(), 'YYMMDD') || '-' || lpad(nextval('public.vybein_order_number_seq')::text, 5, '0'),
    trim(p_customer_name), p_phone, trim(p_address), p_pincode,
    v_order_items, v_subtotal, v_discount, greatest(v_subtotal - v_discount, 0),
    case when v_discount > 0 then 'Buy ' || v_buy_quantity || ', get 1 free' else null end,
    'new'
  )
  returning id, order_ref into v_order_id, v_order_ref;

  return jsonb_build_object(
    'id', v_order_id,
    'order_ref', v_order_ref,
    'subtotal', v_subtotal,
    'discount', v_discount,
    'total', greatest(v_subtotal - v_discount, 0),
    'items', v_order_items
  );
end;
$$;

revoke all on function public.place_order(text, text, text, text, jsonb) from public;
grant execute on function public.place_order(text, text, text, text, jsonb) to anon, authenticated;

-- Reserve known stock only when the owner confirms an order. Cancelling restores it once.
create or replace function public.manage_order_inventory()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item jsonb;
  v_updated_items jsonb := '[]'::jsonb;
  v_stock integer;
  v_quantity integer;
  v_reserved boolean;
begin
  if new.status = 'confirmed' and old.status is distinct from 'confirmed' and not old.stock_reserved then
    for v_item in select value from jsonb_array_elements(old.items)
    loop
      v_quantity := (v_item->>'quantity')::integer;
      select stock into v_stock
        from public.products
        where id = v_item->>'id'
        for update;
      if not found then
        raise exception 'A product in this order no longer exists.';
      end if;
      if v_stock is not null and v_stock < v_quantity then
        raise exception 'Not enough stock to confirm %.', v_item->>'name';
      end if;
      v_reserved := v_stock is not null;
      if v_reserved then
        update public.products
          set stock = stock - v_quantity, updated_at = now()
          where id = v_item->>'id';
      end if;
      v_updated_items := v_updated_items || jsonb_build_array(
        jsonb_set(v_item, '{stock_reserved}', to_jsonb(v_reserved), true)
      );
    end loop;
    new.items := v_updated_items;
    new.stock_reserved := true;
  elsif new.status = 'cancelled' and old.status is distinct from 'cancelled' and old.stock_reserved then
    for v_item in select value from jsonb_array_elements(old.items)
    loop
      if coalesce((v_item->>'stock_reserved')::boolean, false) then
        update public.products
          set stock = stock + (v_item->>'quantity')::integer, updated_at = now()
          where id = v_item->>'id' and stock is not null;
      end if;
    end loop;
    new.stock_reserved := false;
  end if;
  return new;
end;
$$;

drop trigger if exists "reserve and restore VYBEIN inventory" on public.orders;
create trigger "reserve and restore VYBEIN inventory"
  before update of status on public.orders
  for each row execute function public.manage_order_inventory();

revoke all on function public.manage_order_inventory() from public, anon, authenticated;
