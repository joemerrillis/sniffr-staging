# Agent Sanity Plugin

This plugin exposes a minimal health check endpoint for the agent.

## Endpoint

- `GET /_agent/health`

Returns a JSON object `{ ok: true }` confirming the agent is running and responding.

## How to test

1. Start the Sniffr server with this plugin enabled.
2. Send a GET request to `/_agent/health`

Example using `curl`:

```bash
curl http://localhost:port/_agent/health
```

Expected response:

```json
{
  "ok": true
}
```

No database or other dependencies are used by this plugin.
