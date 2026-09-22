# Deployment checklist

## Supabase
- Create project.
- Disable email confirmation for the RP alias/password flow.
- Run migrations 001 → 002 → 003 in order.
- Create a test account from the app.
- Promote the intended GM manually in SQL.
- Run the RLS test plan before opening the hunt.

## Local build
```bash
npm install
npm run check:repo
npm run build
npm run preview
```

## GitHub
Repository secrets:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Do not add a service-role key.

## Before every game session
- Verify GM can access `#/control`.
- Verify a normal player cannot access it.
- Verify Phase I opens for a fresh player.
- Verify no future coordinates have been entered in source/content files.
- Verify the GM knows the physical/in-game next step before approving an analysis.
- Keep a backup/export of the Supabase database if the event is important.

## After the hunt
If the public URL should no longer work, disable the deployment and/or Supabase project. `robots.txt` is only a crawler preference and is not access control.
