# WR4P — Security foundation
This is a **draft database migration**, not a deployed authentication system.

## Rules
1. Every new location belongs to its creator and is private by default.
2. Roles are per-location: viewer, editor, admin. Owner cannot be removed by members.
3. Sensitive details live in a separate table, with independent access permission.
4. Photos must live in a private storage bucket; signed URLs must be short-lived.
5. Never publish address, coordinates, owner contact, original EXIF/GPS or private Dropbox links in the static site.
6. Share links need a server-validated, expiring, revocable token and scoped permissions; never implement this with only a URL parameter.
7. Photo categorization is separate from original filename/order; allow multiple area tags and property-specific categories.

## Before going live
- Create a private Supabase project and apply/review the migration.
- Review RLS policies and test with at least two independent accounts (owner, invited viewer, stranger).
- Add a trusted server/edge function to generate signed media URLs.
- Build login and a private authenticated client. Move all photos off the public GitHub Pages demo.
- Strip EXIF/GPS from derivative previews and ensure originals remain restricted.
- Remove or restrict the existing public demo; its photos are still publicly retrievable.
- Implement share invites, revocation, audit trail, and optional expiry after authorization checks.

No Supabase project, secrets or production access have been configured.
