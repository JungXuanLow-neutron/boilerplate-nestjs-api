---
paths:
  - 'prisma/**/*'
  - 'src/**/*repository.ts'
---

# Persistence rules

- Keep Prisma access behind feature repositories.
- Select only fields needed by the service or response contract; never return password hashes or refresh-token hashes.
- Use database uniqueness, foreign keys, indexes, and transactions to protect durable invariants.
- Use a transaction when a requirement must update multiple records atomically or make an authorization decision against mutable database state.
- Translate expected Prisma failures through the centralized error policy; do not leak raw Prisma errors.

## Schema changes

1. Model the smallest schema change that satisfies the requirement.
2. Consider existing rows, nullability, defaults, indexes, uniqueness, and downgrade/roll-forward behavior.
3. Update `prisma/schema.prisma`.
4. Use `pnpm db:migrate:dev` only to author the migration locally.
5. Review and commit the generated SQL migration.
6. Run `pnpm db:generate`; never edit `src/generated/` manually.
7. Validate with `pnpm db:validate` and exercise the migration through the e2e database path.

- Use `pnpm db:migrate` (`prisma migrate deploy`) in CI and deployment.
- Never run a database reset, drop data, or rewrite an applied migration without explicit approval.
- Keep seed behavior idempotent and take credentials from validated environment variables.
