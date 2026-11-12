-- WR4P security foundation. Apply to a PRIVATE Supabase project after review.
-- No production database is configured by this commit.
create extension if not exists pgcrypto;
create table public.locations (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 code text not null,
 display_name text,
 kind text not null default 'other',
 created_at timestamptz not null default now(),
 unique(owner_id,code)
);
create table public.location_private (
 location_id uuid primary key references public.locations(id) on delete cascade,
 address text, latitude double precision, longitude double precision,
 contact_name text, contact_phone text, contact_email text,
 notes text
);
create table public.location_members (
 location_id uuid not null references public.locations(id) on delete cascade,
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in ('viewer','editor','admin')),
 can_view_private boolean not null default false,
 can_download boolean not null default false,
 primary key(location_id,user_id)
);
create table public.location_photos (
 id uuid primary key default gen_random_uuid(),
 location_id uuid not null references public.locations(id) on delete cascade,
 storage_path text not null,
 original_filename text not null,
 sequence integer not null,
 areas text[] not null default '{}',
 unique(location_id,storage_path)
);
create index on public.location_members(user_id);
create index on public.location_photos(location_id,sequence);
create function public.can_view_location(loc uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.locations l where l.id=loc and l.owner_id=(select auth.uid()))
 or exists(select 1 from public.location_members m where m.location_id=loc and m.user_id=(select auth.uid()))
$$;
create function public.can_manage_location(loc uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.locations l where l.id=loc and l.owner_id=(select auth.uid()))
 or exists(select 1 from public.location_members m where m.location_id=loc and m.user_id=(select auth.uid()) and m.role='admin')
$$;
create function public.can_edit_location(loc uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select public.can_manage_location(loc)
 or exists(select 1 from public.location_members m where m.location_id=loc and m.user_id=(select auth.uid()) and m.role='editor')
$$;
create function public.can_view_private(loc uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.locations l where l.id=loc and l.owner_id=(select auth.uid()))
 or exists(select 1 from public.location_members m where m.location_id=loc and m.user_id=(select auth.uid()) and m.can_view_private)
$$;
alter table public.locations enable row level security;
alter table public.location_private enable row level security;
alter table public.location_members enable row level security;
alter table public.location_photos enable row level security;
create policy locations_read on public.locations for select to authenticated using (public.can_view_location(id));
create policy locations_insert on public.locations for insert to authenticated with check (owner_id=(select auth.uid()));
create policy locations_update on public.locations for update to authenticated using (public.can_edit_location(id)) with check (public.can_edit_location(id) and owner_id=(select owner_id from public.locations where id=locations.id));
create policy locations_delete on public.locations for delete to authenticated using (owner_id=(select auth.uid()));
create policy private_read on public.location_private for select to authenticated using (public.can_view_private(location_id));
create policy private_insert on public.location_private for insert to authenticated with check (public.can_manage_location(location_id));
create policy private_update on public.location_private for update to authenticated using (public.can_manage_location(location_id)) with check (public.can_manage_location(location_id));
create policy private_delete on public.location_private for delete to authenticated using (public.can_manage_location(location_id));
create policy members_read on public.location_members for select to authenticated using (public.can_view_location(location_id));
create policy members_insert on public.location_members for insert to authenticated with check (public.can_manage_location(location_id));
create policy members_update on public.location_members for update to authenticated using (public.can_manage_location(location_id)) with check (public.can_manage_location(location_id));
create policy members_delete on public.location_members for delete to authenticated using (public.can_manage_location(location_id));
create policy photos_read on public.location_photos for select to authenticated using (public.can_view_location(location_id));
create policy photos_insert on public.location_photos for insert to authenticated with check (public.can_edit_location(location_id));
create policy photos_update on public.location_photos for update to authenticated using (public.can_edit_location(location_id)) with check (public.can_edit_location(location_id));
create policy photos_delete on public.location_photos for delete to authenticated using (public.can_edit_location(location_id));
-- Private photo bucket: never public. Access via short-lived signed URLs issued by
-- a trusted backend AFTER checking location permissions and can_download.
-- Do not store Dropbox tokens, service-role keys, addresses or contact data in GitHub Pages.
