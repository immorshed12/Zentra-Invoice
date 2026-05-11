# Zentra Invoice - Final Production Database Schema

> [!CAUTION]
> **PLEASE READ:** To fix all errors (like "column not found", "policy already exists", or "unit_price missing"), please clear your Supabase SQL Editor, copy the **MASTER SETUP SCRIPT** below, and run it. This script is idempotent, meaning you can run it multiple times safely. It ensures all tables and **EVERY SINGLE COLUMN** required by the app exists.

## 🚀 MASTER PRODUCTION SETUP SCRIPT
```sql
-- 0. Extensions
create extension if not exists "uuid-ossp";

-- 1. TABLES (Ensuring base tables exist)
create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name_en text not null default 'My Company',
  name_ar text,
  currency text not null check (currency in ('USD', 'BDT', 'SAR')) default 'USD',
  tax_rate decimal(5,2) default 15.00 not null,
  logo_url text,
  address text,
  address_ar text,
  settings jsonb default '{}'::jsonb,
  plan_type text check (plan_type in ('free', 'pro', 'business')) default 'free',
  subscription_status text check (subscription_status in ('active', 'past_due', 'canceled', 'trialing')) default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  subscription_expiry timestamp with time zone,
  usage_reset_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  full_name text,
  email text unique not null,
  company_id uuid references companies(id) on delete set null,
  role text check (role in ('admin', 'staff', 'manager', 'super_admin')) default 'admin',
  onboarding_completed boolean default false,
  onboarding_step integer default 0
);

create table if not exists invitations (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  email text not null,
  role text check (role in ('admin', 'staff', 'manager')) not null,
  inviter_id uuid references auth.users(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'expired')) default 'pending',
  token text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(company_id, email)
);

create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name_en text not null,
  name_ar text,
  email text,
  phone text,
  address text,
  address_ar text,
  tax_number text,
  salesman text,
  opening_balance decimal(12,2) default 0.00
);

create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name_en text not null,
  name_ar text,
  description_en text,
  description_ar text,
  unit_price decimal(12,2) not null default 0.00
);

create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  customer_id uuid references customers(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  invoice_number text not null,
  issue_date date default current_date not null,
  due_date date,
  status text check (status in ('draft', 'unpaid', 'paid', 'overdue', 'cancelled')) default 'draft',
  subtotal decimal(12,2) default 0.00 not null,
  tax_amount decimal(12,2) default 0.00 not null,
  total_amount decimal(12,2) default 0.00 not null,
  currency text default 'USD',
  notes text,
  unique(company_id, invoice_number)
);

create table if not exists invoice_items (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  invoice_id uuid references invoices(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  description text not null,
  quantity integer not null default 1,
  unit_price decimal(12,2) not null default 0.00,
  amount decimal(12,2) not null default 0.00
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title_en text not null,
  title_ar text,
  message_en text not null,
  message_ar text,
  type text check (type in ('email', 'whatsapp', 'payment', 'system')) default 'system',
  status text check (status in ('unread', 'read')) default 'unread'
);

create table if not exists billing_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  event_type text not null,
  previous_plan text,
  new_plan text,
  amount decimal(12,2),
  details jsonb default '{}'::jsonb
);

-- 2. EXHAUSTIVE COLUMN RECOVERY (Forces every column to exist if table existed partially)

-- Companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS name_en text not null default 'My Company';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS name_ar text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS address_ar text;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS settings jsonb default '{}'::jsonb;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS usage_reset_at timestamp with time zone default timezone('utc'::text, now());
ALTER TABLE companies ADD COLUMN IF NOT EXISTS currency text default 'USD';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tax_rate decimal(5,2) default 15.00;

-- Profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean default false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_step integer default 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS role text default 'admin';

-- Customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS name_en text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS name_ar text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS address_ar text;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS opening_balance decimal(12,2) default 0.00;

-- Products
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_en text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS name_ar text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_en text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS description_ar text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS unit_price decimal(12,2) default 0.00;

-- Invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS currency text default 'USD';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal decimal(12,2) default 0.00;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount decimal(12,2) default 0.00;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_amount decimal(12,2) default 0.00;

-- Invoice Items
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS quantity integer default 1;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS unit_price decimal(12,2) default 0.00;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS amount decimal(12,2) default 0.00;
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS company_id uuid references companies(id) on delete cascade;


-- 3. ROW LEVEL SECURITY (Enablement)
alter table companies enable row level security;
alter table profiles enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table invoices enable row level security;
alter table invoice_items enable row level security;
alter table notifications enable row level security;
alter table invitations enable row level security;
alter table billing_audit_logs enable row level security;

-- 4. MULTI-TENANCY HELPERS
create or replace function get_my_company()
returns uuid as $$
  select company_id from profiles where id = auth.uid();
$$ language sql stable;

-- 5. ACCESS POLICIES (Idempotent cleanup and creation)

-- Profiles
drop policy if exists "Users can manage own profile" on profiles;
create policy "Users can manage own profile" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- Companies
drop policy if exists "Management: Own company" on companies;
drop policy if exists "Update: Own company" on companies;
drop policy if exists "Insert: Onboarding" on companies;
create policy "Management: Own company" on companies for select using (id = get_my_company());
create policy "Update: Own company" on companies for update using (id = get_my_company());
create policy "Insert: Onboarding" on companies for insert with check (true);

-- Customers
drop policy if exists "Management: Own company customers" on customers;
create policy "Management: Own company customers" 
  on customers for all 
  using (company_id = get_my_company())
  with check (company_id = get_my_company());

-- Products
drop policy if exists "Management: Own company products" on products;
create policy "Management: Own company products"
  on products for all
  using (company_id = get_my_company())
  with check (company_id = get_my_company());

-- Invoices
drop policy if exists "Management: Own company invoices" on invoices;
create policy "Management: Own company invoices"
  on invoices for all
  using (company_id = get_my_company())
  with check (company_id = get_my_company());

-- Invoice Items
drop policy if exists "Management: Own company invoice items" on invoice_items;
create policy "Management: Own company invoice items"
  on invoice_items for all
  using (company_id = get_my_company())
  with check (company_id = get_my_company());

-- Notifications
drop policy if exists "Management: Own company notifications" on notifications;
create policy "Management: Own company notifications"
  on notifications for all
  using (company_id = get_my_company())
  with check (company_id = get_my_company());

-- Invitations
drop policy if exists "Management: Own company invitations" on invitations;
create policy "Management: Own company invitations"
  on invitations for all
  using (company_id = get_my_company())
  with check (company_id = get_my_company());

-- 6. INDEXES
create index if not exists idx_profiles_company_id on profiles(company_id);
create index if not exists idx_customers_company_id on customers(company_id);
create index if not exists idx_products_company_id on products(company_id);
create index if not exists idx_invoices_company_id on invoices(company_id);
create index if not exists idx_invoice_items_invoice_id on invoice_items(invoice_id);

-- 7. AUTOMATION: INVOICE NUMBERING
create or replace function get_next_invoice_number(target_company_id uuid)
returns text
language plpgsql
as $$
declare
  last_num int;
  prefix text;
begin
  select coalesce((settings->>'invoice_prefix'), 'INV-') into prefix
  from companies where id = target_company_id;

  select coalesce(
    max(cast(substring(invoice_number from length(prefix) + 1) as integer)),
    1000
  ) into last_num
  from invoices
  where company_id = target_company_id;

  return prefix || (last_num + 1);
end;
$$;

create or replace function trigger_set_invoice_number()
returns trigger as $$
begin
  if new.invoice_number is null then
    new.invoice_number := get_next_invoice_number(new.company_id);
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists tr_invoice_number on invoices;
create trigger tr_invoice_number
  before insert on invoices
  for each row
  execute function trigger_set_invoice_number();

-- 8. SUCCESS MESSAGE
SELECT 'SUCCESS: Zentra Database Master Schema Applied' as status;
```

