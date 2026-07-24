# Boilerplate NestJS API Agent Guide

## Project boundary

- Maintain a NestJS modular monolith for authentication, user administration, self-service profiles, health checks, and private MinIO-backed profile pictures.
- Do not add domain-specific business features, email delivery, password reset, MFA, frontend code, or cloud deployment unless a requirement explicitly adds them.
- Treat the user's current request and acceptance criteria as authoritative. Preserve existing behavior unless the requirement changes it.

## Runtime and commands

- Use Node.js 24 LTS and pnpm 11. Do not use npm or yarn.
- Keep the project ESM and include `.js` extensions in relative TypeScript imports.
- Start infrastructure with `docker compose up -d` only when needed for verification. Do not start long-lived app processes such as `pnpm start`, `pnpm start:dev`, `nest start`, or `node dist/src/main.js` unless the user explicitly asks.
- Use `pnpm db:migrate` for committed migrations and deployments. Use `pnpm db:migrate:dev` only while authoring a new migration.
- Verify changes with the smallest useful focused checks, then run the relevant commands from: `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`.

## Directory ownership

| Path                                  | Purpose                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------- |
| `.agents/skills/`                     | Canonical repository-specific workflows shared by coding agents.                  |
| `.claude/`                            | Claude Code imports, path-scoped rules, skill links, and restrictive permissions. |
| `.codex/rules/`                       | Codex command-execution safety policies.                                          |
| `.github/workflows/`                  | CI and disposable dependency-service setup.                                       |
| `prisma/`                             | Prisma schema, idempotent seed, and committed SQL migrations.                     |
| `src/auth/`                           | Authentication, refresh sessions, guards, and rate limiting.                      |
| `src/users/`                          | Self-service profiles, administration, and profile images.                        |
| `src/health/`                         | Process liveness and dependency readiness.                                        |
| `src/common/`                         | Cross-feature schemas, decorators, types, and centralized errors.                 |
| `src/common/middleware/`              | Global HTTP request preprocessing and structured request logging.                 |
| `src/config/`                         | Environment validation and typed configuration.                                   |
| `src/infrastructure/`                 | Shared Prisma, Redis, and S3-compatible clients.                                  |
| `src/generated/`                      | Prisma-generated code; never edit it manually.                                    |
| `test/`                               | Cross-module integration and end-to-end tests.                                    |
| `dist/`, `coverage/`, `node_modules/` | Generated local artifacts; never treat them as source.                            |

- Put each new business capability in `src/<feature>/` with its module, controller, service, repository, and schemas. Prefer regression coverage under `test/`; do not create or modify `src/**/*.spec.ts` unless the user explicitly requests unit tests.
- Add code to `src/common/` only after at least two features need the abstraction and it contains no feature business rules.
- Update this map in the same change whenever a meaningful source or agent-configuration directory is introduced.

## Architecture rules

- Keep controllers thin: parse transport input, call a service, and return the declared response.
- Keep business rules and authorization decisions in services or guards.
- Keep Prisma queries behind feature repositories. Do not inject `PrismaService` into controllers or feature services.
- Access shared clients through `InfrastructureModule`; do not create feature-local database, Redis, or S3 clients.
- Communicate across features through exported module providers rather than deep imports into another feature's internals.
- Prefer explicit feature code over premature generic abstractions.
- Use middleware only for pre-controller HTTP request or response preprocessing. Keep authentication and authorization in guards, validation and transformation in pipes, controller wrapping in interceptors, and exception mapping in filters.
- Put project-owned global middleware in `src/common/middleware/` and register it in `configureApp()` in explicit execution order.
- Prefer functional middleware when it has no dependencies. Use class middleware with `MiddlewareConsumer` for dependency injection or route-specific application.
- Always call `next()` unless middleware intentionally completes the response.
- For framework-owned capabilities such as rate limiting, OpenAPI security, guards, or validation plumbing, use the official NestJS package and documented lifecycle primitive first. Do not build a custom replacement unless the requirement or repo constraints provide a specific reason.

## Contracts, errors, and security

- Define request, query, parameter, and response contracts with Zod 4 and `nestjs-zod`; keep runtime validation, TypeScript types, serialization, and OpenAPI aligned.
- Preserve the `/api/v1` business prefix, UUID identifiers, bearer security declarations, and generated OpenAPI/Scalar documentation.
- Route failures through the global RFC 9457 Problem Details filter. Never expose stack traces, Prisma internals, tokens, secrets, or serialization diagnostics.
- Reload the current user for protected requests so deactivation and deletion apply immediately.
- Preserve refresh-token rotation/reuse detection, last-active-admin protection, normalized unique emails, private avatar access, signature validation, and the 5 MiB upload limit.
- Never read, print, replace, or commit `.env` unless the user explicitly requests a specific operation. Document variable names in `.env.example`; never put real secrets there or replace the real `.env` with placeholders.
- Redact credentials, tokens, cookies, passwords, and sensitive request fields from logs and test output.

## Persistence rules

- Edit `prisma/schema.prisma`, create and review a SQL migration, then run `pnpm db:generate`; never hand-edit `src/generated/`.
- Use database constraints for durable invariants and transactions for multi-write business operations.
- Make seeds idempotent and require explicit environment input for credentials.
- Stop and get direction before destructive migrations, data loss, or a breaking public API change that the requirement does not explicitly authorize.

## Change workflow

- Use the `implement-requirement` skill for new features, endpoints, fields, integrations, migrations, permissions, or changed behavior.
- Re-ground on the current branch, worktree, and nearby implementation before editing. If the user switches branches, mentions an interruption, or indicates earlier context was stale, inspect the current state again before continuing.
- Inspect nearby implementation and tests before editing. Resolve repository facts through inspection and ask only about material product choices.
- Define observable acceptance criteria and affected contracts before implementation.
- Keep changes scoped and preserve unrelated user work. Do not commit, push, or perform destructive cleanup unless explicitly requested.
- Add regression coverage under `test/` for public behavior, authorization, persistence, dependency integration, and framework configuration changes. Do not add `src/**/*.spec.ts` unless the user explicitly asks for unit tests.
- Update OpenAPI, `.env.example`, README, migrations, and this guide when the corresponding contract or structure changes.

## Definition of done

- The requested behavior and failure cases are implemented end to end.
- Authorization, validation, persistence, errors, documentation, and compatibility were reviewed for impact.
- Relevant focused and full checks pass, or the handoff names the exact failing check and cause.
- The final response reports behavior changed, verification performed, and any remaining risk without exposing secrets.
