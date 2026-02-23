# Deployment Guide (Vercel App + Coolify MySQL on VPS)

This project runs as:
- App: Vercel (Next.js)
- Database: MySQL on your VPS (managed by Coolify)

## 1. Prerequisites

- A Vercel account and linked Git repository.
- A VPS with Coolify installed.
- A domain/subdomain for the app (recommended).
- Ports and firewall access configured on VPS.

## 2. Create MySQL in Coolify

1. In Coolify, create a new **MySQL** service.
2. Set:
   - Database name: `coin_db`
   - Database user: `coin_user`
   - Strong password
3. Persist data with a volume.
4. Deploy the service.

Use this connection pattern:

```env
DATABASE_URL=mysql://coin_user:YOUR_PASSWORD@YOUR_VPS_HOST:3306/coin_db
```

Notes:
- Vercel must be able to reach your VPS on MySQL port (`3306`) or a reverse-proxied DB port.
- Restrict DB access with firewall rules to trusted IPs only when possible.
- If your DB is not publicly reachable, Vercel cannot connect without extra networking setup.

## 3. Prepare Prisma migrations (required before production)

This repository currently has `prisma/schema.prisma` but no `prisma/migrations` folder.
`prisma migrate deploy` only applies existing migrations, so create and commit an initial migration first.

Run locally (against a disposable/local MySQL):

```bash
npx prisma migrate dev --name init
```

Then commit:

- `prisma/migrations/**`
- `prisma/schema.prisma` (if changed)

If you skip this, production deploys will not have a migration history to apply.

## 4. Configure Vercel project

1. Import this repo into Vercel.
2. Framework preset: **Next.js** (auto-detected).
3. Build settings:
   - Build command: `npm run build`
   - Install command: `npm install`
   - Output: default Next.js output

Set these Environment Variables in Vercel (Production at minimum):

- `DATABASE_URL` = your Coolify MySQL connection string
- `AUTH_SECRET` = strong random secret (generate with `npx auth secret`)
- `AUTH_URL` = your production URL (for example `https://app.yourdomain.com`)
- `GOOGLE_CLIENT_ID` = required only if Google login is enabled
- `GOOGLE_CLIENT_SECRET` = required only if Google login is enabled

## 5. Google OAuth callback (if enabled)

In Google Cloud Console, add authorized redirect URI:

```text
https://YOUR_APP_DOMAIN/api/auth/callback/google
```

## 6. Deploy flow

1. Push code to your Git branch.
2. Vercel builds and deploys automatically.
3. After first deploy, confirm:
   - Login works
   - DB tables exist
   - Reads/writes succeed

## 7. Applying schema changes later

For every schema change:

1. Update `prisma/schema.prisma`
2. Create migration locally:
   - `npx prisma migrate dev --name <change_name>`
3. Commit `prisma/migrations/**`
4. Deploy to Vercel

Then run migration in production (pick one):

- Option A: from your machine against production DB:
  - `npx prisma migrate deploy`
- Option B: in Coolify app shell/job with same `DATABASE_URL`:
  - `npx prisma migrate deploy`

## 8. Troubleshooting

- `Can't reach database server`
  - Check VPS firewall/security group and MySQL bind/port.
  - Verify host, port, user, password, database in `DATABASE_URL`.
- `Prisma migrate deploy` does nothing
  - Ensure `prisma/migrations` exists in git.
- Auth redirect issues
  - Verify `AUTH_URL` matches the exact deployed domain.
  - Verify Google redirect URI matches exactly.
