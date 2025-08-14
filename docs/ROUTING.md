# Sniffr – Routing Conventions

## Plugin Registration

- One plugin per feature at: `src/<feature>/routes.js`
- Register in `index.js` with a prefix:

```js
// index.js (example)
import path from 'path';
import fastifyStatic from '@fastify/static';

// Static first
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/rapi-doc/',
  decorateReply: false,
});
await fastify.register(fastifyStatic, {
  root: path.join(__dirname, 'public'),
  prefix: '/',
});

// Feature plugin registration pattern
await fastify.register(import('./src/<feature>/routes.js'), { prefix: '/<feature>' });

// Agent sanity (optional global)
// GET /_agent/health -> { ok: true }
```

**Rule:** Keep handlers small; push logic to a service layer when needed.

---

## Standard REST Patterns

| Method & Path       | Purpose                                        |
|---------------------|------------------------------------------------|
| `GET /resource`     | List (supports pagination/filtering)           |
| `GET /resource/:id` | Fetch one                                      |
| `POST /resource`    | Create                                         |
| `PATCH /resource/:id` | Partial update                               |
| `DELETE /resource/:id` | Delete (prefer soft-delete if applicable)  |

---

## Envelopes

| Type   | Shape Example |
|--------|---------------|
| List   | `{ resources: [ ... ] }` |
| Single | `{ resource: { ... } }`  |
| Health | `{ ok: true }`           |
| Error  | `{ message: string, code?: string }` (no stack traces in responses) |

---

## OpenAPI & RapiDoc

- OpenAPI JSON at `/docs/json`
- RapiDoc at `/rapi-doc/rapidoc.html`

When adding routes, **update OpenAPI** with:
- Tags
- Summary
- Request/response schemas
- Example payloads that match actual DB & envelope shapes

---

## Agent Sanity Endpoints

- `GET /_agent/health` → `{ ok: true }` (used by smoke tests)
- *(Optional)* Global `GET /healthz` → `{ ok: true }`
