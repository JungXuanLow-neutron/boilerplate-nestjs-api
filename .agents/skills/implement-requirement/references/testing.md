---
paths:
  - 'test/**/*.ts'
  - 'vitest*.ts'
---

# Testing and verification rules

## Choose coverage by risk

- Add integration or e2e tests under `test/` for validation boundaries, normalization, coercion, rejected input, and other observable contract behavior.
- Add e2e tests for business rules, authorization invariants, state transitions, and error branches unless the user explicitly requests unit tests.
- Add e2e tests for request mutation, response headers, ordering assumptions, and `next()`-style externally visible middleware behavior.
- Add repository or e2e coverage for constraints, transactions, pagination, migrations, and soft deletion.
- Add e2e tests for public routes, authentication, permissions, documented status codes, and Problem Details content type and shape.
- Use real PostgreSQL, Redis, and MinIO for integration behavior; mock only at unit boundaries.
- Add a regression test that fails before the fix whenever correcting a defect.
- Do not create or modify `src/**/*.spec.ts` unless the user explicitly asks for unit tests.

## Verification order

1. Run the directly affected test file while iterating.
2. Run `pnpm format:check`, `pnpm lint`, and `pnpm typecheck` for TypeScript or configuration changes.
3. Run `pnpm test` only when the repo contains relevant non-e2e tests that the user still wants exercised.
4. Run `pnpm test:e2e` for routes, guards, persistence, Redis, MinIO, migrations, or error-contract changes.
5. Run `pnpm build` before declaring a production-code requirement complete.

- Never weaken or delete an unrelated test to make a change pass.
- Assert observable behavior rather than private implementation details.
- Keep fixtures deterministic and never use real secrets or production data.
- Report skipped or failing checks with the exact reason and remaining risk.
