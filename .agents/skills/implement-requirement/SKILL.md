---
name: implement-requirement
description: Implement or change a requirement in this NestJS API from discovery through verified delivery. Use when asked to add a feature, endpoint, field, business rule, authorization rule, integration, migration, configuration option, or other behavior change. Do not use for explanation-only, status, or read-only review requests.
---

# Implement Requirement

Carry a requirement from repository discovery to a verified, minimal implementation. Treat the user's request as the requirement input and keep unrelated behavior unchanged.

## 1. Establish the contract

1. Read `AGENTS.md`, the relevant feature module, nearby schemas, repositories, tests, Prisma models, and configuration before editing.
2. Re-check the current branch and worktree state before editing. If the user mentions branch changes, interruptions, or stale earlier work, inspect the live repo state again before proceeding.
3. Separate discoverable repository facts from product decisions. Inspect facts; ask only when an unresolved decision would materially change behavior.
4. State observable acceptance criteria, including success, authorization, validation, error, and compatibility behavior.
5. Classify impact across API contracts, persistence, security, configuration, external dependencies, documentation, and tests.
6. Stop for direction before an unrequested breaking API change, destructive migration, ambiguous permission model, new external provider, or unrelated scope expansion.

## 2. Load only relevant guidance

- Read [Nest API rules](references/nest-api.md) for changes under `src/`, especially endpoints, services, schemas, and errors.
- Read [middleware rules](references/middleware.md) for request preprocessing, correlation IDs, logging, security headers, or request-pipeline changes.
- Read [persistence rules](references/persistence.md) for Prisma schema, migrations, seeds, repositories, or transactional behavior.
- Read [security rules](references/security.md) for authentication, authorization, credentials, logging, throttling, or file uploads.
- Read [testing rules](references/testing.md) before choosing and implementing verification coverage.

Read each selected reference completely. Do not load irrelevant references merely because they exist.

## 3. Design the smallest complete slice

1. Assign ownership to an existing feature or create `src/<feature>/` when the capability is genuinely new.
2. Trace the current request path and identify every contract that must change.
3. Prefer a vertical slice over disconnected scaffolding: schema, persistence, business rule, transport, documentation, and tests should agree.
4. Reuse established patterns and official NestJS packages before introducing an abstraction, custom framework implementation, or new production dependency.
5. Plan backward-compatible rollout for schema and public-contract changes whenever the requirement permits it.

## 4. Implement in dependency order

1. Update Zod request and response contracts.
2. Update Prisma schema and add a reviewed migration when persistence changes.
3. Implement repository queries and transactions.
4. Implement service business rules and authorization invariants.
5. Wire middleware, a thin controller, guards, module providers, and OpenAPI metadata only where each lifecycle concern belongs.
6. Update environment validation, `.env.example`, health checks, or infrastructure only when the requirement needs them.
7. Add regression coverage under `test/` by default. Do not create or modify `src/**/*.spec.ts` unless the user explicitly requests unit tests.
8. Update human and agent documentation when commands, structure, or durable conventions change.

Preserve existing user changes. Never edit generated Prisma files, reveal `.env`, or silently broaden the task.

## 5. Verify and review

1. Run the narrowest relevant tests while iterating.
2. Run the full risk-appropriate quality gate described in `AGENTS.md`.
3. Inspect the final changes for missing migrations, stale generated code, secret exposure, undocumented configuration, incomplete OpenAPI schemas, inconsistent errors, and unrelated edits.
4. Confirm acceptance criteria against actual behavior, not only compilation.
5. Report the outcome, important files changed, checks run, and any remaining risk or blocker.
