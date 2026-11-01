-- ANAS PORTFOLIO: Supabase setup / migration
-- Run this entire script in Supabase Dashboard > SQL Editor > New query.
-- This adapts the existing artworks table created during the earlier setup.
-- The project should have one admin Auth user only. Do not create public sign-up.

create extension if not exists pgcrypto;

-- Ensure the public gallery table has the columns required by this version.
alter table public.artworks add column if not exists description text not null default '';
alter table public.artworks add column if not exists media_type text not null default 'image';
alter table public.artworks add column if not exists thumbnail_path text;
alter table public.artworks add column if not exists sort_order integer not null default 0;
alter table public.artworks add column if not exists created_at timestamptz not null default now();

-- Replace any older category check constraint with the five supported panels.
do $$
declare c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.artworks'::regclass and contype = 'c'
  loop
    execute format('alter table public.artworks drop constraint %I', c.conname);
  end loop;
end $$;
alter table public.artworks
  add constraint artworks_category_allowed
  check (category in ('Digital Art','Illustrations','Streamer Assets','Branding','3D Arts'));
alter table public.artworks
  add constraint artworks_media_type_allowed
  check (media_type in ('image','video'));

alter table public.artworks enable row level security;

drop policy if exists "Anyone can view artworks" on public.artworks;
drop policy if exists "Admin can insert artworks" on public.artworks;
drop policy if exists "Admin can update artworks" on public.artworks;
drop policy if exists "Admin can delete artworks" on public.artworks;
drop policy if exists "Public can view portfolio artworks" on public.artworks;
drop policy if exists "Authenticated admin can insert artworks" on public.artworks;
drop policy if exists "Authenticated admin can update artworks" on public.artworks;
drop policy if exists "Authenticated admin can delete artworks" on public.artworks;

create policy "Public can view portfolio artworks"
on public.artworks for select to anon, authenticated using (true);
create policy "Authenticated admin can insert artworks"
on public.artworks for insert to authenticated with check (auth.uid() is not null);
create policy "Authenticated admin can update artworks"
on public.artworks for update to authenticated using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "Authenticated admin can delete artworks"
on public.artworks for delete to authenticated using (auth.uid() is not null);

-- One JSON settings record for branding, theme, social links and page copy.
create table if not exists public.site_settings (
  id integer primary key check (id = 1),
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
drop policy if exists "Public can read site settings" on public.site_settings;
drop policy if exists "Authenticated admin can manage site settings" on public.site_settings;
create policy "Public can read site settings"
on public.site_settings for select to anon, authenticated using (true);
create policy "Authenticated admin can manage site settings"
on public.site_settings for all to authenticated
using (auth.uid() is not null) with check (auth.uid() is not null);

-- Create the public media bucket if it does not exist. Public bucket is needed
-- so visitors can view artwork without logging in. Upload/delete still require auth.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-images','portfolio-images',true,52428800,
  array['image/jpeg','image/png','image/webp','video/mp4','video/webm'])
on conflict (id) do update set
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Admin can upload portfolio images" on storage.objects;
drop policy if exists "Admin can update portfolio images" on storage.objects;
drop policy if exists "Admin can delete portfolio images" on storage.objects;
drop policy if exists "Authenticated admin can upload portfolio media" on storage.objects;
drop policy if exists "Authenticated admin can update portfolio media" on storage.objects;
drop policy if exists "Authenticated admin can delete portfolio media" on storage.objects;

create policy "Authenticated admin can upload portfolio media"
on storage.objects for insert to authenticated
with check (bucket_id = 'portfolio-images' and auth.uid() is not null);
create policy "Authenticated admin can update portfolio media"
on storage.objects for update to authenticated
using (bucket_id = 'portfolio-images' and auth.uid() is not null)
with check (bucket_id = 'portfolio-images' and auth.uid() is not null);
create policy "Authenticated admin can delete portfolio media"
on storage.objects for delete to authenticated
using (bucket_id = 'portfolio-images' and auth.uid() is not null);

-- No public user signup is needed. Create the one admin in Authentication > Users.
-- Keep the GitHub and Supabase project-owner accounts under your control.
