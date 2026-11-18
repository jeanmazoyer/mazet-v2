-- One row per person allowed in. The addresses in ALLOWED_EMAILS are administrators and are
-- created at their first sign-in; everyone else must be invited first.
create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null default '',
  role text not null default 'team' check (role in ('admin', 'team')),
  created_at timestamptz not null default now(),
  last_login timestamptz
);
-- Only the hash of a session token is stored: a copy of this table opens no session.
create table sessions (
  token_hash text primary key,
  user_id uuid not null references users (id) on delete cascade,
  expires_at timestamptz not null
);
-- A deal is saved whole, as the page shows it. `version` goes up at every save: a save that
-- carries an older version is refused, so two people never overwrite each other silently.
create table deals (
  id text primary key,
  doc jsonb not null,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  updated_by uuid references users (id) on delete set null
);
create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
create table files (
  id uuid primary key default gen_random_uuid(),
  deal_id text,
  name text not null,
  mime text not null,
  size integer not null,
  admin_only boolean not null default false,
  created_by uuid references users (id) on delete set null,
  created_at timestamptz not null default now()
);
