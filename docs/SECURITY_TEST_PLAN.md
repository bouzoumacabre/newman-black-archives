# NEWMAN BLACK ARCHIVES — Security / RLS test plan

Run this against a disposable Supabase project after applying migrations `001`, `002`, then `003`.

## Accounts
Create three identities through the normal app:
- `player_a`
- `player_b`
- `gm_test`

Promote only `gm_test` from the Supabase SQL Editor:

```sql
update public.profiles set role = 'admin' where username = 'gm_test';
```

Log out/in after promotion.

## Player isolation
As `player_a`:
1. Query `profiles`: only `player_a` must be visible.
2. Query `player_progress`: only A's rows.
3. Query `submissions`: only A's rows.
4. Query `transmissions`: only A's rows.
5. Query `activity_events`: only A's rows.
6. Query `operator_messages`: only A's rows.
7. Try `.eq('user_id', <player_b uuid>)`: result must be empty, not B's data.

Repeat as `player_b`.

## Forbidden player writes
As `player_a`, direct PostgREST calls must fail for:
- inserting/updating `player_progress`
- updating an existing `submission`
- inserting `transmissions`
- inserting `activity_events`
- inserting `operator_messages`
- calling `unlock_phase(...)`
- calling `review_submission(...)`
- calling `send_operator_message(...)`

## Submission lifecycle
As `player_a`:
1. Phase I exists automatically.
2. Submit >=80 chars: succeeds.
3. Submit a second pending analysis for Phase I: fails (`pending_submission_once`).
4. GM requests revision: new player submission becomes possible.
5. GM approves the newest pending submission with coordinates: transmission appears for A only.
6. Try a new Phase I submission after approval by bypassing the UI: must fail because Phase I is completed.
7. Phase II must still be absent until GM manually calls `unlock_phase`.

## Transmission isolation
After GM approves player A:
- A can read the coordinate.
- B cannot read it, even with A's transmission UUID if discovered.
- There must be no coordinate in the repository, JS bundle, logs or static content before GM approval.
- A second final transmission for the same user/phase must fail.

## Manual phase unlock
As GM:
1. Try to unlock Phase II before Phase I is completed: must fail `PREVIOUS PHASE NOT CLEARED`.
2. Complete Phase I then unlock Phase II: succeeds.
3. Call unlock Phase II again: no duplicate `phase_unlocked` event should be generated.

## R-0 operator channel
As GM:
1. Send a global message to A.
2. Send a Phase I message to A.
3. A sees both on Phase I and the global one on the dashboard.
4. B sees neither.
5. A cannot create an operator message directly.

## Admin player-facing dashboard
Because admin RLS can see all records, verify the normal `/` player-facing dashboard for `gm_test` remains explicitly filtered to the GM account's own rows. It must never aggregate A/B submissions or transmissions.

## Browser / deployment checks
- No `service_role` key in source, env exposed to Vite, build output or GitHub Actions logs.
- `.env` is ignored and not committed.
- `npm run check:repo` passes.
- `npm run build` passes.
- GitHub Pages uses only `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` repository secrets.
- `robots.txt` and noindex meta exist to reduce accidental discovery; they are not treated as security boundaries.
