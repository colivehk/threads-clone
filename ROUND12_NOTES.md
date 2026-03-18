# Round 12 - Enforce reply_audience

This package makes reply permissions real instead of UI-only.

## What it changes
- Carries `reply_audience` / `review_replies` through mapped thread card data
- Blocks unauthorized reply attempts in the UI before opening/using the reply composer
- Re-checks permission at submit time inside `useReplyComposer`
- Adds a database trigger so replies inserted from older pages or direct inserts are also rejected when they violate `reply_audience`

## Files included
- `components/ThreadCard.tsx`
- `hooks/useReplyComposer.ts`
- `lib/thread-types.ts`
- `lib/thread-utils.ts`
- `lib/reply-permissions.ts`
- `supabase/migrations/20260318_round12_enforce_reply_audience.sql`

## Required database step
Run this SQL file in Supabase SQL Editor before testing:

- `supabase/migrations/20260318_round12_enforce_reply_audience.sql`

## Enforcement rules
- `everyone`: any logged-in user can reply
- `followers`: only users following the author can reply
- `following`: only users that the author follows can reply
- `mentioned`: only users mentioned in the post content (for example `@co`) can reply
- authors can always reply to their own posts

## Apply
```bash
cd ~
tar xzvf threads_refactor_round12_reply_audience_enforcement.tar.gz -C threads-clone --strip-components=1

cd ~/threads-clone
rm -rf .next
npm run dev
```
