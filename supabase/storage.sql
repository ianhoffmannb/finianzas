-- Storage bucket for "Hogar" receipts (boletas de supermercado / parafina).
-- Run after schema.sql.

insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', false)
on conflict (id) do nothing;

-- Users may only read/write files under a path prefixed with their own user id,
-- e.g. receipts/<user_id>/2026-09/supermercado.jpg
drop policy if exists "receipts_owner_select" on storage.objects;
create policy "receipts_owner_select" on storage.objects
  for select using (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipts_owner_insert" on storage.objects;
create policy "receipts_owner_insert" on storage.objects
  for insert with check (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipts_owner_update" on storage.objects;
create policy "receipts_owner_update" on storage.objects
  for update using (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "receipts_owner_delete" on storage.objects;
create policy "receipts_owner_delete" on storage.objects
  for delete using (
    bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text
  );
