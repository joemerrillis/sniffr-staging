# Agent Sanity Plugin

This plugin provides a trivial health check endpoint for the agent.

## Added Endpoint

- `GET /_agent/health` 
  - Response: `{ ok: true }`
  - Purpose: Quickly verify the agent is running and responding.

## How to Test

You can test this endpoint using curl or httpie:

```bash
curl -v http://localhost:<agent-port>/_agent/health
```

Expected response:

```json
{
  "ok": true
}
```

Replace `<agent-port>` with your agent's actual listening port.

---

No database or configuration changes were made.
