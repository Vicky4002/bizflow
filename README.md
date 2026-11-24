# BizFlow

BizFlow is a lightweight business workspace for managing customers, services, appointments and invoices.

## Stack
- Next.js 16 / React 19 / TypeScript
- Neon Managed Auth (Better Auth) for email/password and Google OAuth
- Neon PostgreSQL with row-level security
- Vercel deployment

## Local development
1. Enter the application directory: `cd src`
2. Install dependencies: `npm install`
3. Add the environment variables below to `.env.local`
4. Run `npm run dev`

## Required environment variables
- `DATABASE_URL` — restricted application database role connection string
- `NEON_AUTH_BASE_URL` — Neon Auth URL for the production branch
- `NEON_AUTH_COOKIE_SECRET` — long random secret (32+ characters)

Do not commit environment files or credentials. Configure secrets in Vercel Project Settings.

## Deploy
The Vercel project root directory should be `src`. Pushes to the production branch build and deploy automatically.

## Data protection
All business data is queried server-side. API handlers require an authenticated session, use parameterized SQL, establish the user context inside a database transaction, and rely on forced PostgreSQL row-level security policies for tenant isolation.
