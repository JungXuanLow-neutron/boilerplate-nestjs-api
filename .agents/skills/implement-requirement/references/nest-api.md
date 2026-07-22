---
paths:
  - 'src/**/*.ts'
---

# NestJS and API rules

- Keep one Nest feature module per business capability.
- Keep controllers limited to transport concerns and service calls.
- Put business invariants in services and database access in feature repositories.
- Use dependency injection and module exports; do not instantiate services or infrastructure clients directly.
- Avoid deep imports into another feature. Export the narrow provider contract the caller needs.
- Add shared utilities to `src/common/` only when multiple features use them and they contain no feature policy.
- Keep relative ESM imports suffixed with `.js`.
- Use the middleware, guard, pipe, interceptor, and filter lifecycle primitive that owns the concern; consult `middleware.md` for request-pipeline changes.

## Contracts and documentation

- Define bodies, queries, parameters, and responses with Zod 4 through `nestjs-zod` DTOs.
- Derive TypeScript and OpenAPI shapes from the runtime schema instead of maintaining parallel interfaces.
- Declare response schemas and bearer security for protected endpoints.
- Keep business routes under the global `/api/v1` prefix; keep documentation routes outside it.
- Preserve pagination metadata and stable wire names when extending list endpoints.

## Errors

- Throw typed Nest or domain errors that the global filter can map to RFC 9457 Problem Details.
- Use stable machine-readable error codes and validation pointers.
- Map invalid input to `400`, missing authentication to `401`, insufficient permission to `403`, missing records to `404`, conflicts to `409`, throttling to `429`, and unavailable dependencies to `503`.
- Log internal causes against the request ID, but never serialize stacks, Prisma details, tokens, or response-serialization diagnostics.

## Feature completion

- Register new controllers and providers in the owning module.
- Update OpenAPI and Scalar through generated schemas rather than maintaining a separate specification.
- Add unit coverage next to the implementation and e2e coverage under `test/` for externally observable behavior.
