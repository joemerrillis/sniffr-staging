
# Sniffr – Smoke Testing Rules (PR Previews)

## Preview URL
- `https://pr-<PR>-stage.sniffrpack.com`
- RapiDoc: `https://pr-<PR>-stage.sniffrpack.com/rapi-doc/rapidoc.html`

## What `/agent smoke` checks
1) `GET /_agent/health`  
   - Expect **200** and JSON (usually `{ "ok": true }`)
2) `GET /docs/json`  
   - Expect **200** and parsable OpenAPI JSON
3) New routes (when present)  
   - **Happy path** → **2xx** with an **enveloped** body  
   - **Invalid input** → **4xx** with `{ message, code? }`  
   - **Never** 5xx; any 5xx fails smoke and triggers a reviewer fix

## Migrations & Data
- Migrations are applied **only** when you add label `apply-migrations` or comment `/apply-migrations`.
- If a route depends on seed data, include a seed step or example payload in `docs/AGENT_NOTES.md` in the PR.

## Local Dev Quickstart
- `npm run dev` (nodemon)
- App binds `0.0.0.0:${PORT}` (default 3000)
- Manual checks: `/rapi-doc/rapidoc.html` and `/docs/json`
