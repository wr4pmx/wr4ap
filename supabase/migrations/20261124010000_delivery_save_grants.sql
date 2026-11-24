-- Restore the privileges required by the invoker save_location_delivery RPC.
-- Existing RLS policies restrict access to owners; the item trigger checks project consistency.
grant select, insert, update on public.location_deliveries to authenticated;
grant select, insert, delete on public.location_delivery_items to authenticated;
