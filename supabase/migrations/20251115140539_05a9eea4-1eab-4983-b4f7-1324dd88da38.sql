-- Create KYC storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('kyc', 'kyc', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- RLS policies for storage.objects bucket 'kyc'
-- Owners can read their own objects
drop policy if exists "kyc: owners can read" on storage.objects;
create policy "kyc: owners can read"
on storage.objects for select
to authenticated
using (bucket_id = 'kyc' and owner = auth.uid());

-- Owners can upload (insert)
drop policy if exists "kyc: owners can insert" on storage.objects;
create policy "kyc: owners can insert"
on storage.objects for insert
to authenticated
with check (bucket_id = 'kyc' and owner = auth.uid());

-- Owners can update their own
drop policy if exists "kyc: owners can update" on storage.objects;
create policy "kyc: owners can update"
on storage.objects for update
to authenticated
using (bucket_id = 'kyc' and owner = auth.uid())
with check (bucket_id = 'kyc' and owner = auth.uid());

-- Owners can delete their own
drop policy if exists "kyc: owners can delete" on storage.objects;
create policy "kyc: owners can delete"
on storage.objects for delete
to authenticated
using (bucket_id = 'kyc' and owner = auth.uid());

-- Admins (kx_admin) can read all KYC images
drop policy if exists "kyc: admin read" on storage.objects;
create policy "kyc: admin read"
on storage.objects for select
to authenticated
using (bucket_id = 'kyc' and public.has_role(auth.uid(), 'kx_admin'));

-- Admins can manage all KYC images
drop policy if exists "kyc: admin all" on storage.objects;
create policy "kyc: admin all"
on storage.objects for all
to authenticated
using (bucket_id = 'kyc' and public.has_role(auth.uid(), 'kx_admin'))
with check (bucket_id = 'kyc' and public.has_role(auth.uid(), 'kx_admin'));