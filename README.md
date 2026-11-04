# BNW

Portail RP (GTA / FiveM) de commande de missions. Le réseau privé est piloté par **SN** : il émet des ordres (image + instructions) à un agent, l'agent coche « terminé », SN valide.

## Flux

1. SN (`#/control/missions`) choisit un agent, saisit titre / instructions et joint une image des ordres.
2. L'agent voit l'ordre sur son tableau de bord et clique **MARQUER TERMINÉ** → statut `ATTENTE VALIDATION`.
3. SN clique **VALIDER** → la mission est clôturée pour les deux. **RENVOYER** la remet en cours chez l'agent.

## Installation

```bash
npm install
cp .env.example .env   # VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

Ne jamais mettre de clé `service_role` dans le frontend.

## Base Supabase

SQL Editor → exécuter dans l'ordre les fichiers de `supabase/migrations/` (le dernier, `202611030001_missions.sql`, remplace les tables de l'ancienne chasse au trésor et crée `missions` + le bucket privé `mission-orders`).

Désactiver la confirmation email dans Supabase Auth (alias + clé d'accès → email technique interne).

## Premier compte SN (admin)

Créer un compte depuis le site, puis :

```sql
update public.profiles set role = 'admin' where username = 'votre_alias';
```

## Sécurité

- RLS partout : un agent ne lit que ses missions et ses images ; seul un admin crée, valide, renvoie, supprime.
- L'agent ne peut changer qu'une chose : `complete_mission` (sa mission, `active` → `awaiting_validation`).
- Images : bucket privé, URL signées (1 h), PNG/JPG/WEBP, 5 Mo.
- Les nouveaux comptes sont toujours `player` (trigger base).

## Déploiement

`npm run build` → `dist/`. Workflow GitHub Pages dans `.github/workflows/deploy.yml` (secrets `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).

## Comptes, rôles, chat

- Une inscription est **en attente** tant que l'admin ne l'a pas acceptée (`#/control/accounts`) : accepter comme **agent** (reçoit des missions) ou **employé** (émet des missions et voit toutes les missions, en cours ou transmises), ou refuser.
- Seul l'admin valide / renvoie / supprime une mission. L'admin reste attribué à la main en SQL.
- `#/chat` : canal commun pour tous les membres approuvés (l'admin peut supprimer un message).
