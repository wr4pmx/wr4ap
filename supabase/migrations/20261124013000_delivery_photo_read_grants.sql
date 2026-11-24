-- The photo Edge Function checks delivery status and share token before signing media.
-- Limit its database reads to the columns required by that flow.
grant select (token, delivery_id, enabled) on public.location_delivery_shares to service_role;
grant select (id, status) on public.location_deliveries to service_role;
grant select (id, delivery_id, location_id, sort_order) on public.location_delivery_items to service_role;
grant select (id, location_id, storage_path, original_filename, sequence_number, area_tags) on public.location_media to service_role;
