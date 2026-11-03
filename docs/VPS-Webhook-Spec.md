# Stellent QA — VPS Webhook Spec

How the web app and the audit engine (VPS) talk to each other. Two endpoints,
one shared secret, sent as `x-webhook-secret` in **both** directions. Mirrors
CMA's job + callback pattern.

---

## 1. Trigger a job (app → VPS)

The app POSTs here when a user runs an audit (and, later, for scheduled and
free public audits).

```text
POST https://qa-intake.stellent.work/run-audit        # override via VPS_AUDIT_URL
Content-Type: application/json
x-webhook-secret: <WEBHOOK_SECRET>
```

| Field | Type | Description |
|-------|------|-------------|
| `run_id` | string (UUID) | The `audit_runs.id` for this run. Echo it back in the callback. |
| `site_url` | string (URL) | The site to audit. |
| `callback_url` | string (URL) | Where to POST the result. The app sends `<NEXT_PUBLIC_APP_URL>/api/audit/receive-result`. |
| `audit_type` | `full` \| `free` | `full` for signed-in users; `free` for the lightweight public audit. |

**Expected response:** `202 Accepted` quickly (the job runs async). Optionally
return JSON `{ "estimated_wait_minutes": 2, "queue_count": 1 }`. The app waits at
most 20s for this acknowledgement, then treats the trigger as failed.

---

## 2. Return the result (VPS → app)

When the audit finishes (success or failure), POST to the `callback_url` from
the job.

```text
POST <callback_url>
Content-Type: application/json
x-webhook-secret: <WEBHOOK_SECRET>
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `run_id` | string (UUID) | Yes | Must match the job's `run_id`. |
| `status` | `complete` \| `failed` | Yes | (`completed` is also accepted.) |
| `verdict` | string | No | Plain-English summary, e.g. "3 critical issues found across 5 modules". Max 1000 chars. |
| `score` | int (0–100) | No | Overall health score. |
| `pdf_url` | string (URL) | No | Link to a generated PDF report. Max 1000 chars. |
| `error_message` | string | No | Recommended when `status` is `failed`. Max 1000 chars. |
| `findings` | array | No | Per-finding details (below). Max 500. |

### Finding object

| Field | Type | Description |
|-------|------|-------------|
| `test_id` | string | e.g. `TC-05.01`. |
| `module` | string | e.g. `onpage-seo`. |
| `title` | string | Short finding title. |
| `severity` | int (0–4) | 0 = critical … 4 = minor. |
| `status` | `pass` \| `fail` \| `warning` | Finding outcome. |
| `detail` | string | What was found. |
| `how_to_fix` | string | Plain-English fix guidance. |

### Example

```json
{
  "run_id": "b2c3d4e5-f6a7-8901-bcde-f23456789012",
  "status": "complete",
  "verdict": "3 critical issues found across 5 modules",
  "score": 62,
  "pdf_url": "https://storage.example.com/reports/abc.pdf",
  "findings": [
    {
      "test_id": "TC-05.01",
      "module": "onpage-seo",
      "title": "Missing meta description",
      "severity": 2,
      "status": "fail",
      "detail": "The homepage has no <meta name=\"description\">.",
      "how_to_fix": "Add a 150–160 character meta description summarising the page."
    }
  ]
}
```

---

## 3. Auth, idempotency & retries

- Every request in both directions must carry the correct `x-webhook-secret`
  (`WEBHOOK_SECRET`). Wrong or missing → `401`. Comparison is constant-time.
- The callback is **idempotent on `run_id`**: once a run is `complete` or
  `failed`, a repeat callback is ignored with `200 Already processed`.
- On a `5xx` from the app, the VPS may retry with a reasonable backoff. Because
  of idempotency, retries after success are safe.
- Unknown `run_id` → `404`. Bad body → `400`.
