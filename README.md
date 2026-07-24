# boilerplate-nestjs-api

## Get started

Requires Node.js 24 LTS, pnpm 11, and Docker.

```sh
cp .env.example .env
pnpm install
docker compose up -d
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm start:dev
```

- API: `http://localhost:3000`
- Health: `http://localhost:3000/api/v1/health/ready`
- Docs: `http://localhost:3000/docs`
- OpenAPI: `http://localhost:3000/openapi.json`
