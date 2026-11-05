# BNW

Portail RP FiveM de missions. L'opérateur du réseau est **SN** — ne jamais écrire son nom complet dans le code, l'UI ou la doc.

## Stack
React + TypeScript + Vite, HashRouter, Supabase (Auth + Postgres RLS + Storage). CSS maison.

## Navigateur
Le site est utilisé dans le navigateur intégré de FiveM (`CitizenFX`). Ne jamais utiliser `window.confirm`, `alert` ou `prompt` : le clic y échoue sans message. Utiliser `ConfirmButton`.

## Visuel
Terminal noir / ambre, bordures carrées, monospace, scanlines. Pas de vert Matrix ni de cyan.

## Modèle
- `missions` (user_id = agent, status `active` → `awaiting_validation` → `validated`, `image_path` dans le bucket privé `mission-orders`).
- Agent : seulement RPC `complete_mission`. Admin : insert/update/delete + RPC `review_mission(id, validate)`.
- `activity_events` : historique réel alimenté par triggers/RPC.
- RLS = vraie frontière de sécurité ; les gardes React ne sont que de l'UX. Jamais de `service_role` côté client.
- Rôle admin attribué à la main en SQL ; nouveaux comptes toujours `player`.

## Fichiers clés
`supabase/migrations/202611030001_missions.sql`, `src/hooks/useMissions.ts`, `src/pages/DashboardPage.tsx` (agent), `src/pages/AdminMissionsPage.tsx` (SN).

Lancer `npm run build` avant et après un changement important.
