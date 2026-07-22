---
paths:
  - 'src/{auth,users,common,config}/**/*.ts'
---

# Security rules

- Deny by default. Make public routes explicit and require authentication everywhere else.
- Reload the current user and status for every protected request.
- Keep role and ownership checks server-side; never trust user identifiers or roles supplied by a request body.
- Preserve protection against self-demotion, self-deletion, and removal of the last active administrator.
- Revoke sessions when status, deletion, or password changes require it.
- Keep access and refresh secrets separate, hash stored refresh tokens, rotate refresh sessions, and revoke all sessions when reuse is detected.
- Normalize emails before lookup or uniqueness checks and use constant-time password verification through Argon2id.

## Data and logging

- Never read or expose `.env` unless the user explicitly requests a specific operation.
- Never commit secrets, tokens, passwords, cookies, private object contents, or real credentials to source, fixtures, logs, or documentation.
- Extend logging redaction whenever a requirement introduces a sensitive field.
- Return generic authentication failures and Problem Details; log internal causes only with the request ID.

## External input and files

- Validate size, structure, and content using trusted parsers or file signatures rather than client-provided MIME types.
- Keep profile images private and stream them only after current-user authorization.
- Apply rate limits to authentication and other abuse-sensitive operations.
- Treat Redis, PostgreSQL, and object-storage failures as dependency failures without leaking endpoints or credentials.
