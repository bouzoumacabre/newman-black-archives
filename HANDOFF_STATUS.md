# Handoff status — 2026-09-22

## Implemented
- React + TypeScript + Vite project structure.
- HashRouter routes for player and Game Master.
- Old prototype visual identity preserved: black/amber terminal, `r0@newman-archive:~/leak`, thin borders, scanlines, CRT noise, subtle data rain.
- Animated boot sequence, typing/decryption/glitch components, reduced-motion support.
- R-0 narrative intro, interactive lore-only command prompt and phase-dependent logs.
- Hebrew fragments integrated subtly.
- Player auth UI using alias + access key mapped internally to Supabase email/password.
- Player dashboard with 4 phases, locked names, progression, real activity history.
- Free-form submission workflow with retry states.
- Coordinate transmission reveal after GM approval, with first-view animation and clipboard fallback.
- Animated phase-unlock authorization notice for newly opened sectors.
- Admin overview, submissions review modal, players, player progression, manual phase unlock, transmissions history.
- Staged GM review UX: choose reject/revision/validate first; coordinates only appear for validation.
- Supabase SQL migrations with tables, triggers, RLS, admin helper, `review_submission` and `unlock_phase` RPCs.
- Hardening migration: no submissions after a phase is cleared, nonblank/unique transmissions, idempotent unlock events.
- Live R-0 operator channel: GM can push player-specific hints/messages from the player admin view; players receive them through RLS-protected polling.
- GitHub Pages workflow, README and CLAUDE.md.

## Security guarantees encoded
- No answer key or automatic grading exists.
- No future GPS coordinates exist in repository content.
- New users are forced to `player` by DB trigger.
- Client never contains a service-role key.
- RLS restricts each player to their own data.
- A cleared phase refuses direct-API resubmission.
- GM approval does not unlock the next phase automatically.
- The next phase is unlocked manually only after the in-game step.
- One final transmission is allowed per player/phase.

## Validation performed here
- TS/TSX files were parsed with TypeScript `transpileModule`: syntax pass.
- `npm run check:repo`: pass.
- Relative project layout/imports are checked separately before packaging.

## Environment limitation
The package registry is not reachable from this execution environment, so a full dependency install / Vite production build cannot be completed here.

On the next machine / Claude Code session, first run:

```bash
npm install
npm run check:repo
npm run build
```

Then fix any dependency/type-level error reported by the real installed packages before adding features.

## Recommended next pass
1. Run the real build and resolve strict TypeScript issues.
2. Create a Supabase dev project and apply all three migrations in order.
3. Test RLS with two player accounts + one admin account.
4. Verify `review_submission` creates exactly one transmission only on approval.
5. Verify a cleared phase rejects a direct PostgREST insert.
6. Test GitHub Pages deployment with repository secrets.
7. Do a final visual pass against `docs/reference/old-ui-*.png`.

## Non-negotiable continuation rule
**NEVER ADD TREASURE SOLUTIONS OR FUTURE GPS COORDINATES TO THE REPOSITORY.**
