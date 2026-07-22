---
paths:
  - 'src/common/middleware/**/*.ts'
  - 'src/app.setup.ts'
  - 'src/app.module.ts'
---

# NestJS middleware rules

## Choose the correct lifecycle primitive

- Use middleware for HTTP work that must happen before route handlers, such as request IDs, structured request logging, and transport-level headers.
- Use guards for authentication, authorization, roles, ownership, and route metadata.
- Use pipes for request validation and transformation.
- Use interceptors to wrap handler execution or transform successful responses.
- Use exception filters to translate failures into the public error contract.
- Do not create a Next.js-style `proxy.ts`; NestJS composes these lifecycle primitives explicitly.

## Select registration scope

- Use functional middleware when it has no injected dependencies.
- Register truly global middleware with `app.use()` in `configureApp()` so it also covers adapter-mounted routes such as Scalar and OpenAPI.
- Use an `@Injectable()` class implementing `NestMiddleware` plus `MiddlewareConsumer` when middleware needs dependency injection or applies only to selected controllers, paths, or methods.
- Apply multiple middleware in an explicit order and document dependencies between them. Request ID must run before request logging.
- Always call `next()` unless the middleware intentionally sends or ends the response.

## Preserve transport guarantees

- Keep middleware free of feature business rules and database access.
- Preserve `req.id`, the `x-request-id` response header, and Problem Details correlation.
- Reuse the established Pino logger and extend its redaction list whenever new sensitive fields enter requests.
- Never log authorization headers, cookies, passwords, refresh tokens, secrets, or private file contents.
- Keep middleware behavior covered by focused unit tests and verify externally visible headers through e2e tests.
