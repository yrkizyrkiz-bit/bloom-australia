# Sanative

Doctor-led biomarker care and member portal for Australians. Marketing site, membership funnels, and authenticated member/admin portals — Next.js App Router on Netlify.

## Stack

- **Next.js 15** (App Router) + TypeScript
- **PostgreSQL** via Prisma
- **NextAuth** (credentials)
- **Stripe** (membership / program payments)
- **Bun** for local scripts and deploys

## Local setup

```bash
bun install
cp .env.example .env
# Fill DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, and Stripe/email keys as needed

bun run db:generate
bun run db:migrate
bun run db:seed   # local seed data only — never use seed passwords in production
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful scripts

| Script | Purpose |
| --- | --- |
| `bun run dev` | Dev server |
| `bun run build` | Production build |
| `bun run test` | Vitest |
| `bun run db:studio` | Prisma Studio |
| `bun run db:migrate:deploy` | Apply migrations in production |

## Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Netlify, env vars, and migrations. Copy env keys from [`.env.example`](./.env.example) — never commit real secrets.

## Security notes

- Member portal, admin, GP, and auth routes are `noindex` and disallowed in `robots.ts`.
- Do not commit audit dumps, patient exports, or scripts that print PHI.
- Production accounts must use unique strong passwords — seed/demo credentials are for local development only.
