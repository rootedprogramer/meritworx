-- MeritWorx · Phase 1 (Foundation) schema
-- Run once in a NEW Supabase project: SQL Editor → paste → Run.
-- Covers: users, settings, applicants, companies, profile_views, waitlist,
-- level_history, audit_log, storage buckets, and every server-side rule.
-- Later phases (quotes, payments, reviews, specials, sponsors) add tables on top.

create extension if not exists pgcrypto;

-- ───────────────────────── Types
create type user_role      as enum ('homeowner', 'company', 'admin');
create type company_status as enum ('invited', 'pending', 'live', 'paused');
create type level_id       as enum ('verified', 'trusted', 'respected', 'distinguished', 'exemplary');
create type company_plan   as enum ('app', 'half_page', 'full_page');

-- ───────────────────────── Helpers
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create or replace function level_rank(l level_id) returns int
language sql immutable as $$
  select case l when 'verified' then 1 when 'trusted' then 2 when 'respected' then 3
                when 'distinguished' then 4 when 'exemplary' then 5 end;
$$;

-- ───────────────────────── users (one row per login)
create table users (
  id         uuid primary key references auth.users on delete cascade,
  phone      text,
  email      text,
  role       user_role not null default 'homeowner',
  name       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger users_updated before update on users for each row execute function set_updated_at();

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, phone, email) values (new.id, new.phone, new.email)
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from users where id = auth.uid() and role = 'admin');
$$;

alter table users enable row level security;
create policy users_select on users for select using (id = auth.uid() or is_admin());
create policy users_update on users for update using (id = auth.uid()) with check (id = auth.uid());
-- People can change their own name, never their role.
revoke update on users from anon, authenticated;
grant update (name) on users to authenticated;

-- ───────────────────────── settings (single row, edited in Admin → Settings)
create table settings (
  id int primary key default 1 check (id = 1),
  level_names jsonb not null default '{"verified":"Verified","trusted":"Trusted","respected":"Respected","distinguished":"Distinguished","exemplary":"Exemplary"}',
  level_descriptions jsonb not null default '{"verified":"License and insurance checked before joining.","trusted":"A record of paid jobs and good reviews on MeritWorx.","respected":"Consistently strong reviews over time.","distinguished":"Top ratings across many completed jobs.","exemplary":"The highest standard of work and service on MeritWorx."}',
  categories jsonb not null default '[{"name":"Plumbing","on":true},{"name":"Electrical","on":true},{"name":"HVAC","on":true},{"name":"Roofing","on":true},{"name":"Landscaping","on":true},{"name":"Pest control","on":true},{"name":"Painting","on":true},{"name":"Handyman","on":true},{"name":"Cleaning","on":true},{"name":"Garage doors","on":true}]',
  areas jsonb not null default '["Birmingham","Homewood","Mountain Brook","Vestavia Hills","Hoover","Trussville","Pelham","Alabaster","Helena","Chelsea","Gardendale","Irondale"]',
  auto_charge_hours int not null default 48,
  reminder_days int[] not null default '{1,3,7}',
  starting_level_rule jsonb not null default '{"default":"verified","editors_guide_client":"respected"}',
  level_rules jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
insert into settings (id) values (1);
create trigger settings_updated before update on settings for each row execute function set_updated_at();
alter table settings enable row level security;
create policy settings_read   on settings for select using (true);
create policy settings_update on settings for update using (is_admin()) with check (is_admin());

-- ───────────────────────── level_history and audit_log (admin read only; written by the server)
create table level_history (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null,
  from_level level_id,
  to_level level_id not null,
  reason text,
  factors_snapshot jsonb,
  changed_by text not null check (changed_by in ('system', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table level_history enable row level security;
create policy level_history_admin on level_history for select using (is_admin());

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor uuid,
  action text not null,
  target text,
  before jsonb,
  after jsonb,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table audit_log enable row level security;
create policy audit_admin on audit_log for select using (is_admin());

create or replace function audit_changes() returns trigger
language plpgsql security definer set search_path = public as $$
declare tgt text;
begin
  if tg_op = 'DELETE' then tgt := old.id::text; else tgt := new.id::text; end if;
  insert into audit_log (actor, action, target, before, after, reason)
  values (auth.uid(), tg_table_name || '.' || lower(tg_op), tgt,
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end,
          nullif(current_setting('app.level_reason', true), ''));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger settings_audit after update on settings for each row execute function audit_changes();

-- ───────────────────────── applicants (invited companies until approved)
create table applicants (
  id uuid primary key default gen_random_uuid(),
  invite_token uuid not null unique default gen_random_uuid(),
  status text not null default 'invited' check (status in ('invited', 'submitted', 'approved', 'declined')),
  applicant_user_id uuid references users,
  approved_company_id uuid,
  name text not null,
  owner_name text,
  category text,
  service_areas text[] not null default '{}',
  phone text,
  email text,
  website text,
  about text,
  logo text,
  license_number text,
  license_file text,
  insurance_file text,
  insurance_expires date,
  plan company_plan not null default 'app',
  editors_guide_client boolean not null default false,
  referred_by text,
  rating_source text not null default 'MeritWorx review',  -- ratings come from the admin team's own vetting
  rating numeric(2,1) check (rating between 1 and 5),
  review_count int check (review_count >= 0),
  license_on_file boolean not null default false,
  insurance_on_file boolean not null default false,
  certificate_requested boolean not null default false,
  invited boolean not null default true,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger applicants_updated before update on applicants for each row execute function set_updated_at();
create trigger applicants_audit after insert or update or delete on applicants for each row execute function audit_changes();
alter table applicants enable row level security;
create policy applicants_admin on applicants for all using (is_admin()) with check (is_admin());

-- ───────────────────────── companies
create table companies (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references users,
  name text not null,
  owner_name text,
  category text not null,
  service_areas text[] not null check (cardinality(service_areas) >= 1),
  phone text,
  email text,
  website text,
  about text,
  logo text,
  photos text[] not null default '{}',
  license_number text,
  license_file text,
  insurance_file text,
  insurance_expires date,
  level level_id not null default 'verified',
  years_on_list int not null default 0,
  status company_status not null default 'pending',
  stripe_account_id text,
  payouts_ready boolean not null default false,
  plan company_plan not null default 'app',
  billing_status text not null default 'free_until_payments',
  editors_guide_client boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger companies_updated before update on companies for each row execute function set_updated_at();

-- Owners may edit their profile fields only; level changes always need a written reason.
create or replace function guard_company_update() returns trigger
language plpgsql as $$
begin
  if not is_admin() then
    if (new.owner_user_id, new.name, new.category, new.level, new.status, new.plan, new.billing_status,
        new.stripe_account_id, new.payouts_ready, new.license_number, new.license_file, new.insurance_file,
        new.insurance_expires, new.editors_guide_client, new.years_on_list, new.email)
       is distinct from
       (old.owner_user_id, old.name, old.category, old.level, old.status, old.plan, old.billing_status,
        old.stripe_account_id, old.payouts_ready, old.license_number, old.license_file, old.insurance_file,
        old.insurance_expires, old.editors_guide_client, old.years_on_list, old.email) then
      raise exception 'Only an admin can change that field';
    end if;
  end if;
  if new.level is distinct from old.level
     and coalesce(current_setting('app.level_reason', true), '') = '' then
    raise exception 'A level change needs a written reason';
  end if;
  return new;
end $$;
create trigger companies_guard before update on companies for each row execute function guard_company_update();
create trigger companies_audit after insert or update or delete on companies for each row execute function audit_changes();

alter table companies enable row level security;
create policy companies_select on companies for select using (owner_user_id = auth.uid() or is_admin());
create policy companies_update on companies for update using (owner_user_id = auth.uid() or is_admin());
create policy companies_insert on companies for insert with check (is_admin());
create policy companies_delete on companies for delete using (is_admin());

-- What homeowners see: live companies in categories that are turned on. No private fields.
create view public_companies as
select c.id, c.name, c.owner_name, c.category, c.service_areas, c.phone, c.website, c.about,
       c.logo, c.photos, c.level, level_rank(c.level) as level_rank, c.years_on_list, c.created_at
from companies c
cross join settings s
where c.status = 'live'
  and exists (select 1 from jsonb_array_elements(s.categories) e
              where e->>'name' = c.category and (e->>'on')::boolean);
grant select on public_companies to anon, authenticated;

create or replace function is_live_company(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from companies where id = cid and status = 'live');
$$;

-- ───────────────────────── profile_views
create table profile_views (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies on delete cascade,
  viewed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profile_views_company on profile_views (company_id, viewed_at);
alter table profile_views enable row level security;
create policy pv_insert on profile_views for insert to anon, authenticated with check (is_live_company(company_id));
create policy pv_select on profile_views for select using (
  is_admin() or exists (select 1 from companies c where c.id = company_id and c.owner_user_id = auth.uid()));

-- ───────────────────────── waitlist (homeowners before launch, plus companies asking for an invitation)
create table waitlist (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'homeowner' check (kind in ('homeowner', 'company')),
  name text not null,
  email text,
  phone text,
  neighborhood text,
  trade text,
  business_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table waitlist enable row level security;
create policy waitlist_insert on waitlist for insert to anon, authenticated with check (true);
create policy waitlist_admin  on waitlist for select using (is_admin());
create policy waitlist_delete on waitlist for delete using (is_admin());

-- ───────────────────────── Server-side actions
create or replace function get_invite(p_token uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', name, 'owner_name', owner_name, 'email', email,
                            'category', category, 'service_areas', service_areas, 'status', status)
  from applicants where invite_token = p_token;
$$;
grant execute on function get_invite(uuid) to anon, authenticated;

create or replace function submit_application(p_token uuid, p jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare a applicants;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select * into a from applicants where invite_token = p_token for update;
  if not found then raise exception 'This invitation link is not valid'; end if;
  if a.status not in ('invited', 'submitted') then raise exception 'This invitation has already been used'; end if;
  if a.applicant_user_id is not null and a.applicant_user_id <> auth.uid() then
    raise exception 'This invitation belongs to another account';
  end if;
  if jsonb_array_length(coalesce(p->'service_areas', '[]')) < 1 then
    raise exception 'Choose at least one service area';
  end if;
  update applicants set
    applicant_user_id = auth.uid(),
    name = coalesce(nullif(p->>'name', ''), name),
    owner_name = p->>'owner_name',
    category = p->>'category',
    service_areas = array(select jsonb_array_elements_text(p->'service_areas')),
    phone = p->>'phone',
    email = p->>'email',
    website = p->>'website',
    about = p->>'about',
    logo = nullif(p->>'logo', ''),
    license_number = p->>'license_number',
    license_file = coalesce(nullif(p->>'license_file', ''), license_file),
    insurance_file = coalesce(nullif(p->>'insurance_file', ''), insurance_file),
    insurance_expires = nullif(p->>'insurance_expires', '')::date,
    plan = coalesce(nullif(p->>'plan', ''), 'app')::company_plan,
    editors_guide_client = coalesce((p->>'editors_guide_client')::boolean, false),
    status = 'submitted'
  where id = a.id;
end $$;
grant execute on function submit_application(uuid, jsonb) to authenticated;

create or replace function my_application() returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('name', name, 'status', status, 'certificate_requested', certificate_requested)
  from applicants where applicant_user_id = auth.uid() order by created_at desc limit 1;
$$;
grant execute on function my_application() to authenticated;

create or replace function approve_applicant(p_id uuid, p_level level_id) returns uuid
language plpgsql security definer set search_path = public as $$
declare a applicants; cid uuid;
begin
  if not is_admin() then raise exception 'Admins only'; end if;
  select * into a from applicants where id = p_id for update;
  if not found then raise exception 'Application not found'; end if;
  if a.status <> 'submitted' then raise exception 'Only submitted applications can be approved'; end if;
  if a.applicant_user_id is null then raise exception 'The company has not applied yet'; end if;
  if not a.insurance_on_file or a.insurance_file is null then
    raise exception 'Insurance certificate must be on file. Ask for the certificate, then mark it received.';
  end if;
  if a.insurance_expires is null or a.insurance_expires < current_date then
    raise exception 'The insurance certificate has expired or has no expiry date';
  end if;

  insert into companies (owner_user_id, name, owner_name, category, service_areas, phone, email, website, about,
                         logo, license_number, license_file, insurance_file, insurance_expires, level, status,
                         plan, billing_status, editors_guide_client)
  values (a.applicant_user_id, a.name, a.owner_name, a.category, a.service_areas, a.phone, a.email, a.website,
          a.about, a.logo, a.license_number, a.license_file, a.insurance_file, a.insurance_expires, p_level, 'live',
          a.plan,
          case when a.plan in ('half_page', 'full_page') then 'billed_by_editors_guide' else 'free_until_payments' end,
          a.editors_guide_client)
  returning id into cid;

  update applicants set status = 'approved', approved_company_id = cid where id = p_id;
  update users set role = 'company' where id = a.applicant_user_id and role <> 'admin';
  insert into level_history (company_id, from_level, to_level, reason, changed_by)
  values (cid, null, p_level, 'Starting level at approval', 'admin');
  return cid;
end $$;
grant execute on function approve_applicant(uuid, level_id) to authenticated;

create or replace function set_company_level(p_company uuid, p_level level_id, p_reason text) returns void
language plpgsql security definer set search_path = public as $$
declare old_level level_id;
begin
  if not is_admin() then raise exception 'Admins only'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'A level change needs a written reason'; end if;
  select level into old_level from companies where id = p_company for update;
  if not found then raise exception 'Company not found'; end if;
  if old_level = p_level then return; end if;
  perform set_config('app.level_reason', p_reason, true);
  update companies set level = p_level where id = p_company;
  insert into level_history (company_id, from_level, to_level, reason, changed_by)
  values (p_company, old_level, p_level, p_reason, 'admin');
end $$;
grant execute on function set_company_level(uuid, level_id, text) to authenticated;

-- ───────────────────────── Storage
-- logos: public images. documents: licenses and insurance, private (signed links for admin only).
insert into storage.buckets (id, name, public) values ('logos', 'logos', true), ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "logos upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "logos update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "documents upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "documents read own or admin" on storage.objects for select to authenticated
  using (bucket_id = 'documents' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- ───────────────────────── After running: make yourselves admins
-- 1. Sign in once on the live site with your email or phone.
-- 2. Run:  update users set role = 'admin' where email in ('you@example.com', 'mom@example.com');
