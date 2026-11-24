# BizFlow

BizFlow is a business workspace for managing customers, services, appointments and invoices.

## Stack
- Next.js 16, React 19 and TypeScript
- Neon Managed Auth (Better Auth)
- Neon PostgreSQL with forced row-level security
- Vercel Git deployments

## Local development
1. Run `cd src`.
2. Install with `npm install`.
3. Copy `.env.example` to `.env.local` and fill in the three required values.
4. Run `npm run dev`.

## Environment
- `DATABASE_URL`: restricted `bizflow_runtime` PostgreSQL role connection string. Do not use the database owner URL.
- `NEON_AUTH_BASE_URL`: Neon Managed Auth URL for the production branch.
- `NEON_AUTH_COOKIE_SECRET`: a random secret of at least 32 characters.

Never commit `.env.local` or credentials. Configure environment variables in Vercel Project Settings.

## Deployment
The Vercel project is linked to this GitHub repository. Its root directory is `src`; pushes to `main` trigger deployments.

## Security model
All business data is queried server-side. API handlers require an authenticated session, use parameterized SQL, establish the authenticated user context inside a database transaction, and rely on forced PostgreSQL row-level security policies for tenant isolation.
