-- The Square — Storage buckets and policies
-- Esegui dopo city-wall-schema.sql.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wall-images',
  'wall-images',
  true,
  5242880,
  array['image/png','image/jpeg','image/webp','image/gif']
)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wall-audio',
  'wall-audio',
  true,
  10485760,
  array['audio/mpeg','audio/mp3','audio/wav','audio/webm','audio/ogg','audio/mp4']
)
on conflict (id) do nothing;

-- Lettura pubblica asset Wall.
drop policy if exists "Public read wall images" on storage.objects;
create policy "Public read wall images" on storage.objects
for select using (bucket_id = 'wall-images');

drop policy if exists "Public read wall audio" on storage.objects;
create policy "Public read wall audio" on storage.objects
for select using (bucket_id = 'wall-audio');

-- Upload utenti autenticati nella propria cartella /user_id/...
drop policy if exists "Users upload own wall images" on storage.objects;
create policy "Users upload own wall images" on storage.objects
for insert to authenticated
with check (bucket_id = 'wall-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users upload own wall audio" on storage.objects;
create policy "Users upload own wall audio" on storage.objects
for insert to authenticated
with check (bucket_id = 'wall-audio' and (storage.foldername(name))[1] = auth.uid()::text);

-- Aggiornamento/eliminazione solo dei file propri.
drop policy if exists "Users update own wall images" on storage.objects;
create policy "Users update own wall images" on storage.objects
for update to authenticated
using (bucket_id = 'wall-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own wall images" on storage.objects;
create policy "Users delete own wall images" on storage.objects
for delete to authenticated
using (bucket_id = 'wall-images' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users update own wall audio" on storage.objects;
create policy "Users update own wall audio" on storage.objects
for update to authenticated
using (bucket_id = 'wall-audio' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users delete own wall audio" on storage.objects;
create policy "Users delete own wall audio" on storage.objects
for delete to authenticated
using (bucket_id = 'wall-audio' and (storage.foldername(name))[1] = auth.uid()::text);
