---
paths:
  - 'src/**/*.spec.ts'
  - 'test/**/*.ts'
  - 'vitest*.ts'
---

# Testing and verification rules

## Choose coverage by risk

- Add schema tests for validation boundaries, normalization, coercion, and rejected input.
- Add service unit tests for business rules, authorization invariants, state transitions, and error branches.
- Add middleware unit tests for request mutation, response headers, ordering assumptions, and `next()` behavior.
- Add repository or e2e coverage for constraints, transactions, pagination, migrations, and soft deletion.
- Add e2e tests for public routes, authentication, permissions, documented status codes, and Problem Details content type and shape.
- Use real PostgreSQL, Redis, and MinIO for integration behavior; mock only at unit boundaries.
- Add a regression test that fails before the fix whenever correcting a defect.

## Verification order

1. Run the directly affected test file while iterating.
2. Run `pnpm format:check`, `pnpm lint`, and `pnpm typecheck` for TypeScript or configuration changes.
3. Run `pnpm test` for application logic changes.
4. Run `pnpm test:e2e` for routes, guards, persistence, Redis, MinIO, migrations, or error-contract changes.
5. Run `pnpm build` before declaring a production-code requirement complete.

- Never weaken or delete an unrelated test to make a change pass.
- Assert observable behavior rather than private implementation details.
- Keep fixtures deterministic and never use real secrets or production data.
- Report skipped or failing checks with the exact reason and remaining risk.
