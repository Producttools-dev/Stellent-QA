/**
 * Constant-time string comparison for webhook secret validation.
 *
 * Avoids leaking secret length/content through early-exit timing, matching the
 * `timingSafeEqual` helper CMA uses on every inbound webhook.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Validates the `x-webhook-secret` header against WEBHOOK_SECRET.
 * Returns a Response to short-circuit with, or null when the request is authorized.
 */
export function assertWebhookSecret(request: Request): Response | null {
  const secret = process.env["WEBHOOK_SECRET"];
  if (!secret) {
    console.error("[webhook] WEBHOOK_SECRET not configured");
    return new Response("Not configured", { status: 500 });
  }
  const provided = request.headers.get("x-webhook-secret") ?? "";
  if (!timingSafeEqual(provided, secret)) {
    console.warn("[webhook] rejected: bad secret");
    return new Response("Unauthorized", { status: 401 });
  }
  return null;
}
