# Clean cumulative package (round2 → round8)

This package is meant to be applied on top of the original `threads-clone` project.

## Recommended steps

1. Restore your original project folder.
2. Overlay this package into the project root:

```bash
cd ~
tar xzvf threads_refactor_round2_to_round8_clean.tar.gz -C threads-clone --strip-components=1
cd ~/threads-clone
rm -rf .next
npm run dev
```

## Database notes

- Keep your original `follows` + `notifications` SQL/triggers.
- Do **not** reintroduce `user_follows`.
- If you want the profile-related UI from later rounds, run:
  `supabase/migrations/20260317_round8_user_profiles_only.sql`
- If you previously wrote bad rows like `following = 'undefined'`, clean them with:

```sql
delete from public.follows
where following = 'undefined';
```
