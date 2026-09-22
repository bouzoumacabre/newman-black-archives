# NEWMAN BLACK ARCHIVES — handoff notes

## Mission
This repository implements the RP/FiveM treasure-hunt portal **NEWMAN BLACK ARCHIVES / BNW-VLT-1924**. It is an in-lore compromised Newman Bank archive controlled narratively by the unknown operator **R-0**.

## Non-negotiable rule
**NEVER ADD TREASURE SOLUTIONS OR FUTURE GPS COORDINATES TO THE REPOSITORY.**

Coordinates only exist after a Game Master types them while approving a player's submission. There is no automatic answer grading.

## Stack
- React + TypeScript + Vite
- HashRouter for GitHub Pages compatibility
- Supabase Auth + PostgreSQL + RLS
- Custom CSS; no generic SaaS component library

## Visual identity
Keep the existing old-terminal look: almost-black background, amber/gold Newman palette, square borders, monospace typography, CRT scanlines, light noise, terminal logs. Do not replace it with Matrix-green or cyan-heavy hacker styling.

## Narrative progression
1. Phase I / sector R-0 / Roxwood — stable compromised bank archive.
2. Phase II / sector E-1 / L'Échiquier — intelligence / SSR / Mossad fragments.
3. Phase III / sector C-7 / Canaan — O.A.C., Hebrew fragments, unexplained S.F. activity.
4. Phase IV / sector Ω / La Fin — degraded system; nodes fail and GALAPAGOS becomes visible.

R-0 is not omniscient. Never explain who or what R-0, A.N., or S.F. are inside code/content.

## Real logs vs lore logs
- `activity_events`: real database history visible to users/admins.
- `src/content/systemLogs.ts`: fake in-universe decorative system logs only.
Never mix secrets or real coordinates into lore logs.

## Security model
Browser only receives `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
Never use Supabase `service_role` in the client.
RLS is the actual authorization boundary; React route guards are UX only.
New users are always created as `player` by a database trigger. Admin role is granted manually through Supabase SQL Editor.

## Player flow
1. Create ghost identity (alias + access key).
2. Phase I unlocks automatically.
3. Read RP documents outside this web app.
4. Submit free-form analysis.
5. Game Master reviews manually.
6. If approved, GM types a GTA coordinate; transmission becomes readable by that player only.
7. GM manually unlocks the next phase after the in-game step.

## Admin flow
`#/control`
- Review submissions: reject / request revision / approve + transmit coordinates.
- Inspect players and progression.
- Manually unlock next phase with `unlock_phase` RPC.
- No admin self-promotion UI.

## Key files
- `supabase/migrations/202609220001_newman_black_archives.sql`: schema, triggers, RLS, RPCs.
- `supabase/migrations/202609220002_hardening.sql`: second-pass security constraints and idempotent unlock.
- `supabase/migrations/202609220003_operator_messages.sql`: GM-to-player live R-0 messages stored server-side.
- `src/content/phases.ts`: phase metadata only.
- `src/content/systemLogs.ts`: in-lore fake terminal logs only.
- `src/content/hebrew.ts`: allowed Hebrew fragments and internal meanings.
- `src/contexts/AuthContext.tsx`: Supabase session/profile layer.
- `src/hooks/usePlayerData.ts`: player data polling.
- `src/pages/AdminSubmissionsPage.tsx`: Game Master review flow.

## Continuation priorities
If continuing this codebase:
1. Run `npm run build` before and after major changes.
2. Do not weaken RLS to solve frontend issues.
3. Preserve HashRouter unless deployment strategy changes intentionally.
4. Keep animations subtle and respect `prefers-reduced-motion`.
5. Do not add long Hebrew paragraphs; use 1–3 fragments per screen.
6. Never store answers or coordinates client-side.
7. Keep the two migrations ordered; do not fold security hardening out unless a fresh migration is produced.
8. Preserve the staged GM review UX: coordinates are requested only after choosing VALIDATE.
9. Player-specific R-0 hints should use `operator_messages`; do not hard-code future GM hints into the bundle when they are intended to remain secret until sent.

## Visual reference screenshots
The user's previous prototype screenshots are preserved only as development references and are not part of the Vite `public/` output:
- `docs/reference/old-ui-01.png`
- `docs/reference/old-ui-02.png`
- `docs/reference/old-ui-03.png`

Use these to preserve the exact black/amber terminal DNA. Do not copy old mechanics such as the manual decryption-key field; the new flow uses GM approval + server-side transmission.
