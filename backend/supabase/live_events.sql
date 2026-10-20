-- Run once in Supabase SQL editor to add Live Events and private registrations.
create table if not exists public.live_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  event_date date,
  venue text not null default '',
  poster_path text not null,
  published boolean not null default true,
  registration_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.live_events(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists event_registrations_event_email_unique
  on public.event_registrations (event_id, lower(email));

alter table public.live_events enable row level security;
alter table public.event_registrations enable row level security;

drop policy if exists "public read published live events" on public.live_events;
create policy "public read published live events"
  on public.live_events for select
  using (published = true);

drop policy if exists "admin manages live events" on public.live_events;
create policy "admin manages live events"
  on public.live_events for all
  using (my_role() = 'admin')
  with check (my_role() = 'admin');

drop policy if exists "public registers for open live events" on public.event_registrations;
create policy "public registers for open live events"
  on public.event_registrations for insert
  with check (
    exists (
      select 1
      from public.live_events live_event
      where live_event.id = event_registrations.event_id
        and live_event.published = true
        and live_event.registration_open = true
    )
  );

drop policy if exists "admin reads event registrations" on public.event_registrations;
create policy "admin reads event registrations"
  on public.event_registrations for select
  using (my_role() = 'admin');
