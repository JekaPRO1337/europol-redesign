create extension if not exists pgcrypto;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null default '',
  phone text not null,
  comment text,
  status text not null default 'new' check (status in ('new', 'in_progress', 'completed', 'cancelled')),
  total_price numeric(12, 2) not null default 0,
  source text not null default 'cart',
  payment_method text not null default 'callback',
  needs_callback boolean not null default true
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_name text not null,
  product_price numeric(12, 2) not null default 0,
  area numeric(10, 2) not null default 0,
  width numeric(10, 2) not null default 0,
  length numeric(10, 2) not null default 0,
  quantity integer not null default 1 check (quantity > 0)
);

create table if not exists public.calculator_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  selected_products jsonb not null default '[]'::jsonb,
  calculated_price numeric(12, 2) not null default 0,
  phone text,
  comment text
);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_created_at_idx on public.orders (status, created_at desc);
create index if not exists orders_phone_idx on public.orders (phone);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists calculator_requests_created_at_idx on public.calculator_requests (created_at desc);
create index if not exists calculator_requests_phone_idx on public.calculator_requests (phone);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.calculator_requests enable row level security;
alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

drop policy if exists "Anyone can create orders" on public.orders;
create policy "Anyone can create orders"
on public.orders
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read orders" on public.orders;
create policy "Admins can read orders"
on public.orders
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can update orders" on public.orders;
create policy "Admins can update orders"
on public.orders
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Anyone can create order items" on public.order_items;
create policy "Anyone can create order items"
on public.order_items
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read order items" on public.order_items;
create policy "Admins can read order items"
on public.order_items
for select
to authenticated
using (public.is_admin());

drop policy if exists "Anyone can create calculator requests" on public.calculator_requests;
create policy "Anyone can create calculator requests"
on public.calculator_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admins can read calculator requests" on public.calculator_requests;
create policy "Admins can read calculator requests"
on public.calculator_requests
for select
to authenticated
using (public.is_admin());

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
on public.admin_users
for select
to authenticated
using (public.is_admin() or user_id = auth.uid());

drop policy if exists "Admins can delete orders" on public.orders;
create policy "Admins can delete orders"
on public.orders
for delete
to authenticated
using (public.is_admin());

drop policy if exists "Admins can delete calculator requests" on public.calculator_requests;
create policy "Admins can delete calculator requests"
on public.calculator_requests
for delete
to authenticated
using (public.is_admin());
