-- Messages set to leave later. The job is kept as asked; who may receive it and which files belong to
-- the deal are checked again when it leaves.
create table mail_outbox (
  id uuid primary key default gen_random_uuid(),
  deal_id text not null,
  job jsonb not null,
  send_at timestamptz not null,
  status text not null default 'pending',
  error text not null default '',
  created_by text not null,
  created_at timestamptz not null default now(),
  done_at timestamptz
);
create index mail_outbox_due on mail_outbox (send_at) where status = 'pending';

-- One line per sent message whose opens and clicks are followed. The token is all the message carries;
-- the links it replaces stay here.
create table mail_tracks (
  token text primary key,
  deal_id text not null,
  message_id text not null default '',
  subject text not null default '',
  links jsonb not null default '[]',
  sent_by text not null default '',
  sent_at timestamptz not null default now(),
  opens integer not null default 0,
  first_open timestamptz,
  last_open timestamptz,
  clicks integer not null default 0,
  last_click timestamptz
);
create index mail_tracks_deal on mail_tracks (deal_id);
