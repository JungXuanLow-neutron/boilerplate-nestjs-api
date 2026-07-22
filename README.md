# timesheet-api

A production-shaped NestJS 11 modular monolith for authentication, user administration, self-service profiles, and private MinIO-backed profile pictures.

## Local startup

Requires Node.js 24 LTS, pnpm 11, and Docker.

```sh
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm start:dev
```

Readiness is at `http://localhost:3000/api/v1/health/ready`. Scalar API documentation is at `http://localhost:3000/docs`; raw OpenAPI is at `/openapi.json`.

The Compose file runs infrastructure only. PostgreSQL, Redis, and MinIO data is persisted in named volumes. Production and CI should always use `prisma migrate deploy` (`pnpm db:migrate`); use `pnpm db:migrate:dev` only when authoring a new migration.

## Commands

```sh
pnpm lint
pnpm format:check
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Public registration always creates a `USER`. The seed is idempotent and requires the three `SEED_ADMIN_*` variables. Avatar objects remain private and are streamed through authenticated API requests.

## Request pipeline

NestJS has no Next.js-style `proxy.ts` convention. Application-wide preprocessing lives in `src/common/middleware/` and is registered in `src/app.setup.ts` in this order: Helmet security headers, request ID, and Pino request logging. Authentication and rate limiting remain global Nest guards; Zod validation uses a pipe, response serialization uses an interceptor, and errors use the global Problem Details filter.

## Coding agents

Repository conventions and folder ownership are defined in `AGENTS.md`. Claude Code imports the same guide through `CLAUDE.md`, so the two agents share one source of truth.

For a new feature or behavior change, invoke `$implement-requirement` in Codex or `/implement-requirement` in Claude Code. The workflow inspects the existing vertical slice, defines acceptance criteria, implements the smallest complete change, and runs risk-appropriate verification.
