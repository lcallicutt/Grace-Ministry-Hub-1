# Grace Ministry Hub

A ministry operations workspace that helps church teams prepare services, coordinate volunteers, and create communication materials with Grace.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required secret: `Grace_Pilot_GEC` — Anthropic API key used server-side for Grace responses

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/grace-ministry-hub` — responsive React web app
- `artifacts/api-server/src/routes/ministry.ts` — ministry API behavior and document generation
- `lib/api-spec/openapi.yaml` — API contract and generated client source of truth
- `lib/db/src/schema` — church profiles, conversations, messages, and service plans

## Architecture decisions

- The first version is a single-church workspace; church details are reusable defaults across the app.
- Service builder outputs are generated and stored together so a saved plan always preserves its bulletin, projection content, and announcer sheet.
- Grace conversations are persisted as conversation and message records.
- Grace chat and weekly service documents are generated with Claude through Anthropic's server-side Messages API.

## Product

- Grace workspace with ministry-specific quick prompts and saved conversations
- Weekly service builder with bulletin, projection, and announcer-sheet output
- Church profile for reusable church and service details
- Responsive navigation for desktop and mobile church staff

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
