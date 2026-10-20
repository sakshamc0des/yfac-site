-- YFAC backend on the Supabase free plan. Run once: Dashboard > SQL editor > paste > Run.
-- Roles: visitor (default) | alumni | member (can approve alumni) | admin (everything).

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text, name text,
  role text not null default 'visitor' check (role in ('visitor','alumni','member','admin')),
  created_at timestamptz default now()
);
create function my_role() returns text language sql stable security definer set search_path = public
as $$ select coalesce((select role from profiles where id = auth.uid()), 'visitor') $$;

create function handle_new_user() returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into profiles (id, email, name) values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- Content ---------------------------------------------------------------------------
create table post_holders (id uuid primary key default gen_random_uuid(), role text not null, name text not null, year text default '2026-27', pri int default 9, photo_path text);
create table faculty      (id uuid primary key default gen_random_uuid(), name text not null, post text not null, descr text, pri int default 9, photo_path text);
create table members      (id uuid primary key default gen_random_uuid(), name text not null, dept text, year text, contact text);
create table alumni       (id uuid primary key default gen_random_uuid(), name text not null, batch text, org text, contact text);
create table requests     (id uuid primary key default gen_random_uuid(), kind text not null check (kind in ('member','alumni')), name text not null, dept text, year text, org text, contact text, msg text, status text not null default 'pending', created_at timestamptz default now());
create table announcements(id uuid primary key default gen_random_uuid(), type text, title text not null, txt text, link text, active boolean default true, created_at timestamptz default now());
create table gallery      (id uuid primary key default gen_random_uuid(), cap text, photo_path text not null, created_at timestamptz default now());
create table push_subscriptions (id uuid primary key default gen_random_uuid(), endpoint text unique not null, p256dh text not null, auth text not null, created_at timestamptz default now());

-- Public views hide contact details from visitors ---------------------------------
create view members_public with (security_invoker = false) as select id, name, dept, year from members;
create view alumni_public  with (security_invoker = false) as select id, name, batch, org from alumni;
grant select on members_public, alumni_public to anon, authenticated;

-- Row level security -------------------------------------------------------------------
alter table profiles enable row level security;
alter table post_holders enable row level security;
alter table faculty enable row level security;
alter table members enable row level security;
alter table alumni enable row level security;
alter table requests enable row level security;
alter table announcements enable row level security;
alter table gallery enable row level security;
alter table push_subscriptions enable row level security;

create policy "see own profile" on profiles for select using (id = auth.uid() or my_role() = 'admin');
create policy "admin edits profiles" on profiles for update using (my_role() = 'admin');

create policy "public read" on post_holders for select using (true);
create policy "public read" on faculty for select using (true);
create policy "public read" on gallery for select using (true);
create policy "public read" on announcements for select using (active);
create policy "admin writes" on post_holders for all using (my_role() = 'admin') with check (my_role() = 'admin');
create policy "admin writes" on faculty for all using (my_role() = 'admin') with check (my_role() = 'admin');
create policy "admin writes" on gallery for all using (my_role() = 'admin') with check (my_role() = 'admin');
create policy "admin writes" on announcements for all using (my_role() = 'admin') with check (my_role() = 'admin');
create policy "admin writes" on members for all using (my_role() = 'admin') with check (my_role() = 'admin');
create policy "admin writes" on alumni for all using (my_role() = 'admin') with check (my_role() = 'admin');

create policy "anyone can ask" on requests for insert with check (status = 'pending');
create policy "reviewers read" on requests for select using (my_role() in ('member','admin'));
create policy "anyone can subscribe" on push_subscriptions for insert with check (true);

-- Approval rules live here, so the browser cannot cheat ----------------------------
-- admin approves member requests, any member (or admin) approves alumni requests
create function approve_request(req uuid, ok boolean) returns void
language plpgsql security definer set search_path = public as $$
declare r requests;
begin
  select * into r from requests where id = req and status = 'pending';
  if not found then raise exception 'Request not found'; end if;
  if r.kind = 'member' and my_role() <> 'admin' then raise exception 'Only the admin approves members'; end if;
  if r.kind = 'alumni' and my_role() not in ('member','admin') then raise exception 'Only members approve alumni'; end if;
  if ok and r.kind = 'member' then
    insert into members (name, dept, year, contact) values (r.name, r.dept, r.year, r.contact);
  elsif ok then
    insert into alumni (name, batch, org, contact) values (r.name, r.year, r.org, r.contact);
  end if;
  update requests set status = case when ok then 'approved' else 'rejected' end where id = req;
end $$;

-- Photos: Storage > New bucket > name "photos" > Public bucket ON. Then run: -----------
create policy "public photo read"  on storage.objects for select using (bucket_id = 'photos');
create policy "admin photo upload" on storage.objects for insert with check (bucket_id = 'photos' and my_role() = 'admin');
create policy "admin photo delete" on storage.objects for delete using (bucket_id = 'photos' and my_role() = 'admin');

-- Your existing event photos (shipped in /img) ---------------------------------------------
insert into gallery (cap, photo_path, created_at) values
  ('Nirbhed Foundation visit', 'img/nirb.jpg', now() - interval '0 seconds'),
  ('Working with children', 'img/teach.jpg', now() - interval '1 seconds'),
  ('Drawing together', 'img/draw.jpg', now() - interval '2 seconds'),
  ('Drawing session under the banyan', 'img/banyan.jpg', now() - interval '3 seconds'),
  ('The YFAC family', 'img/team.jpg', now() - interval '4 seconds'),
  ('Introducing YFAC on stage', 'img/talk.jpg', now() - interval '5 seconds'),
  ('JSS Panchayat', 'img/pan.jpg', now() - interval '6 seconds'),
  ('On stage', 'img/skit.jpg', now() - interval '7 seconds'),
  ('Art session', 'img/paint1.jpg', now() - interval '8 seconds'),
  ('Festooning workshop', 'img/art1.jpg', now() - interval '9 seconds'),
  ('Art session', 'img/paint2.jpg', now() - interval '10 seconds'),
  ('Festooning workshop', 'img/art2.jpg', now() - interval '11 seconds'),
  ('Garba Eve', 'img/garbap.jpg', now() - interval '12 seconds'),
  ('Garba Eve', 'img/garba.jpg', now() - interval '13 seconds'),
  ('Zone Mile', 'img/run.jpg', now() - interval '14 seconds'),
  ('Zone Mile', 'img/runp.jpg', now() - interval '15 seconds'),
  ('Zone Mile warm-up', 'img/warm.jpg', now() - interval '16 seconds'),
  ('Zone Mile, race morning', 'img/road.jpg', now() - interval '17 seconds'),
  ('Team lunch', 'img/lunch.jpg', now() - interval '18 seconds'),
  ('Recruitment drive', 'img/recruit.jpg', now() - interval '19 seconds'),
  ('Mural painting', 'img/mural.jpg', now() - interval '20 seconds'),
  ('Mural painting', 'img/ladder.jpg', now() - interval '21 seconds'),
  ('Festooning crew', 'img/fest.jpg', now() - interval '22 seconds'),
  ('Festooning workshop', 'img/paint3.jpg', now() - interval '23 seconds'),
  ('Recruitment drive, classroom visit', 'img/class1.jpg', now() - interval '24 seconds'),
  ('Recruitment drive, classroom visit', 'img/class2.jpg', now() - interval '25 seconds');

-- FIRST ADMIN: sign in once on the site with Google, then run this with your Google email:
-- update profiles set role = 'admin' where email = 'you@example.com';
