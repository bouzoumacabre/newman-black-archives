# NEWMAN BLACK ARCHIVES

Application web immersive pour la chasse au trésor GTA RP / FiveM **Le Trésor des Newman**.

Le portail se présente comme un ancien réseau clandestin de Newman Bank compromis par l'opérateur inconnu **R-0**. Les joueurs créent une identité fantôme, soumettent leur compréhension de chaque phase, puis le Game Master valide manuellement et transmet une coordonnée GTA. Aucune solution et aucune coordonnée future ne sont stockées dans le dépôt.

## 1. Prérequis

- Node.js 20.19+
- npm
- Un projet Supabase
- Facultatif : un dépôt GitHub pour GitHub Pages

## 2. Installation locale

```bash
npm install
cp .env.example .env
npm run dev
```

Dans `.env` :

```env
VITE_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=VOTRE_CLE_PUBLIQUE
```

N'ajoutez jamais une `service_role` key au frontend.

## 3. Créer la base Supabase

Dans Supabase → **SQL Editor**, exécutez les migrations **dans cet ordre** :

```text
supabase/migrations/202609220001_newman_black_archives.sql
supabase/migrations/202609220002_hardening.sql
supabase/migrations/202609220003_operator_messages.sql
```

La seconde migration durcit le flux : une phase déjà validée ne peut plus recevoir une nouvelle analyse via un appel direct, les transmissions sont uniques par phase, les coordonnées vides sont refusées et le déblocage manuel devient idempotent. La troisième ajoute le canal vivant `R-0` : le Game Master peut envoyer à un joueur un indice ou message RP créé à la volée, éventuellement rattaché à une phase, sans le précharger dans le bundle frontend.

La migration crée :

- `profiles`
- `player_progress`
- `submissions`
- `transmissions`
- `activity_events`
- `operator_messages`
- les enums
- les triggers de création de joueur
- les politiques RLS
- `review_submission(...)`
- `unlock_phase(...)`
- `send_operator_message(...)`

## 4. Authentification RP alias + mot de passe

L'interface demande seulement :

- `ALIAS`
- `CLÉ D'ACCÈS`

En interne, l'alias est transformé en email technique `alias@newman-archive.invalid` pour Supabase Auth. Cet email n'est jamais affiché au joueur.

Dans Supabase Auth, désactivez la confirmation email pour ce projet RP afin que l'inscription alias/mot de passe ouvre directement une session. Le libellé exact peut varier selon l'interface Supabase.

## 5. Créer le premier Game Master

1. Créez un compte normalement depuis le site.
2. Dans Supabase → SQL Editor :

```sql
update public.profiles
set role = 'admin'
where username = 'votre_alias';
```

3. Déconnectez/reconnectez le compte.
4. Le panneau Game Master devient accessible à `#/control`.

Il n'existe volontairement aucun bouton frontend pour devenir admin.

## 6. Workflow joueur

- Phase I est déverrouillée automatiquement.
- Le joueur envoie une analyse libre d'au moins 80 caractères.
- Une seule analyse `pending` peut exister simultanément pour une phase.
- Le joueur ne peut voir que ses propres données grâce à RLS.
- Une validation fait apparaître la transmission avec les coordonnées saisies par le Game Master.
- Les messages R-0 envoyés par le Game Master sont récupérés côté serveur et restent isolés par joueur/phase.
- La phase suivante reste verrouillée jusqu'au déblocage manuel du Game Master.

## 7. Workflow Game Master

Dans `#/control` :

- `OVERVIEW` : statistiques et activité.
- `SUBMISSIONS` : lire les analyses et choisir `REFUSER`, `DEMANDER COMPLÉMENT` ou `VALIDER ET TRANSMETTRE`.
- `PLAYERS` : voir la progression individuelle et débloquer la prochaine phase.
- `TRANSMISSIONS` : historique des coordonnées envoyées.
- Dans la fiche d’un joueur : canal **R-0 OPERATOR** pour envoyer un message/indice dynamique, y compris un fragment hébreu ponctuel. Ne l’utilisez pas pour les coordonnées GPS : celles-ci passent uniquement par `VALIDER ET TRANSMETTRE`.

Une validation `approved` exige une coordonnée. Cette coordonnée est créée à ce moment-là seulement.

## 8. Sécurité

Les règles principales sont appliquées dans PostgreSQL :

- RLS activé sur toutes les tables publiques de l'application.
- Un joueur ne lit que son profil, sa progression, ses soumissions, transmissions et événements.
- Les joueurs ne créent pas de transmission et ne débloquent pas les phases.
- Les nouveaux comptes sont toujours forcés à `player` côté base.
- `private.is_admin()` vérifie le rôle administrateur côté base.
- Les RPC critiques vérifient à nouveau l'administrateur.

**Le masquage d'un bouton React n'est pas considéré comme une sécurité.**

### Important : contenu frontend inspectable

Tout texte statique placé dans `src/content/` finit dans le JavaScript envoyé au navigateur, même s'il est visuellement verrouillé. Les noms/logs présents dans ces fichiers doivent donc être considérés comme de l'ambiance ou du foreshadowing, **pas comme un secret critique**. Pour un indice qui ne doit réellement apparaître qu'au bon moment, envoyez-le via le canal `operator_messages` depuis la fiche joueur Game Master. Les coordonnées restent exclusivement dans `transmissions` après validation.


## 9. Perte de clé d’accès

Les comptes RP utilisent une adresse interne fictive dérivée de l’alias. Il n’existe donc **pas de récupération de mot de passe par email côté joueur**. Si un joueur perd sa clé d’accès, le Game Master doit intervenir depuis le tableau de bord Supabase Auth. Ne mettez jamais une clé `service_role` dans cette application pour automatiser cette opération.

## 10. Vérification du dépôt

Avant chaque déploiement :

```bash
npm run check:repo
npm run build
```

`check:repo` recherche les noms de variables/fichiers typiques qui pourraient indiquer qu’une solution ou une coordonnée future a été ajoutée au dépôt. Ce scan est une garde supplémentaire, pas un substitut à une revue humaine.

## 11. Build

```bash
npm run build
npm run preview
```

Le résultat de production se trouve dans `dist/`.

## 12. GitHub Pages

Le projet utilise `HashRouter` et `base: './'`, adaptés à un hébergement statique GitHub Pages.

Créez dans GitHub → Repository Settings → Secrets and variables → Actions :

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Le workflow `.github/workflows/deploy.yml` construit puis publie `dist/`.

## 13. Règle absolue de la chasse

Ne jamais ajouter au dépôt :

- solutions des phases
- mots-clés de correction
- réponses attendues
- coordonnées futures
- emplacement final du trésor

Le logiciel ne sait pas résoudre la chasse. Le Game Master reste l'unique arbitre.
