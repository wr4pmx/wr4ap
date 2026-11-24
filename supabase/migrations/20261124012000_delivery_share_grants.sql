-- Delivery owners manage shares under the existing row-level policy.
-- Direction reads the published payload through the existing token RPC.
grant select, insert on public.location_delivery_shares to authenticated;
grant update (enabled) on public.location_delivery_shares to authenticated;
