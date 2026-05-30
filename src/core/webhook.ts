/**
 * PayPal webhook helpers.
 *
 * Signature verification is performed via the PayPal API
 * (POST /v1/notifications/verify-webhook-signature) and is implemented
 * in resources/webhooks.ts — not here.
 */

export type PayPalWebhookEvent<TResource = unknown> = {
  /** The ID of the webhook event notification. */
  readonly id?: string | undefined;
  /** The date and time when the webhook event notification was created. */
  readonly create_time?: string | undefined;
  /** The name of the resource related to the webhook notification event. */
  readonly resource_type?: string | undefined;
  /** The event version. */
  readonly event_version?: string | undefined;
  /** The event that triggered the webhook event notification. */
  readonly event_type?: string | undefined;
  /** A summary description for the event notification. */
  readonly summary?: string | undefined;
  /** The resource version. */
  readonly resource_version?: string | undefined;
  /** The resource that triggered the event. */
  readonly resource?: TResource | undefined;
  /** HATEOAS links. */
  readonly links?: Array<{ href?: string; rel?: string; method?: string }> | undefined;
};

export type WebhookTransmissionHeaders = {
  transmissionId: string;
  transmissionTime: string;
  transmissionSig: string;
  certUrl: string;
  authAlgo: string;
};

export type VerifyWebhookPayload = {
  transmission_id: string;
  transmission_time: string;
  cert_url: string;
  auth_algo: string;
  transmission_sig: string;
  webhook_id: string;
  webhook_event: unknown;
};

export function parseWebhookEvent<TResource = unknown>(
  rawBody: Buffer | string,
): PayPalWebhookEvent<TResource> {
  const text = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : rawBody;
  const parsed = JSON.parse(text) as PayPalWebhookEvent<TResource>;

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new TypeError('PayPal webhook payload must be a JSON object.');
  }

  return parsed;
}

function getHeaderValue(
  headers: Record<string, string | string[] | undefined> | Headers,
  name: string,
): string {
  if (headers instanceof Headers) {
    return headers.get(name) ?? '';
  }

  const value = headers[name.toLowerCase()] ?? headers[name];
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

export function extractTransmissionHeaders(
  headers: Record<string, string | string[] | undefined> | Headers,
): WebhookTransmissionHeaders {
  return {
    transmissionId: getHeaderValue(headers, 'paypal-transmission-id'),
    transmissionTime: getHeaderValue(headers, 'paypal-transmission-time'),
    transmissionSig: getHeaderValue(headers, 'paypal-transmission-sig'),
    certUrl: getHeaderValue(headers, 'paypal-cert-url'),
    authAlgo: getHeaderValue(headers, 'paypal-auth-algo'),
  };
}

export function buildVerifyWebhookPayload(params: {
  headers: Record<string, string | string[] | undefined> | Headers;
  webhookId: string;
  event: unknown;
}): VerifyWebhookPayload {
  const { transmissionId, transmissionTime, transmissionSig, certUrl, authAlgo } =
    extractTransmissionHeaders(params.headers);

  return {
    transmission_id: transmissionId,
    transmission_time: transmissionTime,
    cert_url: certUrl,
    auth_algo: authAlgo,
    transmission_sig: transmissionSig,
    webhook_id: params.webhookId,
    webhook_event: params.event,
  };
}
