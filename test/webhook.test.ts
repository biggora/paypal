import { describe, expect, it, vi } from 'vitest';

import { PayPalApiError, createPayPalClient } from '../src/index.js';
import {
  buildVerifyWebhookPayload,
  extractTransmissionHeaders,
  parseWebhookEvent,
} from '../src/index.js';
import type { FetchRequestInput } from '../src/index.js';

function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

const SAMPLE_EVENT = {
  id: 'evt-1',
  event_type: 'PAYMENT.CAPTURE.COMPLETED',
  resource_type: 'capture',
  event_version: '1.0',
  create_time: '2024-01-01T00:00:00Z',
  resource: { id: 'cap-1', amount: { value: '10.00', currency_code: 'USD' } },
};

describe('parseWebhookEvent', () => {
  it('parses a valid JSON buffer into a webhook event object', () => {
    const raw = Buffer.from(JSON.stringify(SAMPLE_EVENT));
    const event = parseWebhookEvent(raw);
    expect(event).toEqual(SAMPLE_EVENT);
  });

  it('parses a valid JSON string into a webhook event object', () => {
    const event = parseWebhookEvent(JSON.stringify(SAMPLE_EVENT));
    expect(event).toEqual(SAMPLE_EVENT);
  });

  it('throws TypeError when the payload is a JSON array', () => {
    const raw = JSON.stringify([SAMPLE_EVENT]);
    expect(() => parseWebhookEvent(raw)).toThrow(TypeError);
    expect(() => parseWebhookEvent(raw)).toThrow('PayPal webhook payload must be a JSON object.');
  });

  it('throws SyntaxError when the payload is invalid JSON', () => {
    expect(() => parseWebhookEvent('not-json')).toThrow(SyntaxError);
  });

  it('throws TypeError when the payload is a JSON null', () => {
    expect(() => parseWebhookEvent('null')).toThrow(TypeError);
  });
});

describe('extractTransmissionHeaders', () => {
  const headerValues = {
    'paypal-transmission-id': 'tid-123',
    'paypal-transmission-time': '2024-01-01T00:00:00Z',
    'paypal-transmission-sig': 'sig-abc',
    'paypal-cert-url': 'https://api.paypal.com/v1/notifications/certs/CERT-1',
    'paypal-auth-algo': 'SHA256withRSA',
  };

  it('extracts headers from a Headers instance', () => {
    const headers = new Headers(headerValues);
    const result = extractTransmissionHeaders(headers);
    expect(result).toEqual({
      transmissionId: 'tid-123',
      transmissionTime: '2024-01-01T00:00:00Z',
      transmissionSig: 'sig-abc',
      certUrl: 'https://api.paypal.com/v1/notifications/certs/CERT-1',
      authAlgo: 'SHA256withRSA',
    });
  });

  it('extracts headers from a plain lowercase Record', () => {
    const result = extractTransmissionHeaders(headerValues);
    expect(result).toEqual({
      transmissionId: 'tid-123',
      transmissionTime: '2024-01-01T00:00:00Z',
      transmissionSig: 'sig-abc',
      certUrl: 'https://api.paypal.com/v1/notifications/certs/CERT-1',
      authAlgo: 'SHA256withRSA',
    });
  });

  it('returns empty strings for missing headers', () => {
    const result = extractTransmissionHeaders({});
    expect(result).toEqual({
      transmissionId: '',
      transmissionTime: '',
      transmissionSig: '',
      certUrl: '',
      authAlgo: '',
    });
  });

  it('handles array header values by taking the first element', () => {
    const result = extractTransmissionHeaders({
      'paypal-transmission-id': ['first-tid', 'second-tid'],
    });
    expect(result.transmissionId).toBe('first-tid');
  });
});

describe('buildVerifyWebhookPayload', () => {
  it('builds the correct verify payload shape from headers and event', () => {
    const headers = {
      'paypal-transmission-id': 'tid-456',
      'paypal-transmission-time': '2024-06-01T12:00:00Z',
      'paypal-transmission-sig': 'sig-xyz',
      'paypal-cert-url': 'https://api.paypal.com/v1/notifications/certs/CERT-2',
      'paypal-auth-algo': 'SHA256withRSA',
    };

    const payload = buildVerifyWebhookPayload({
      headers,
      webhookId: 'wh-id-789',
      event: SAMPLE_EVENT,
    });

    expect(payload).toEqual({
      transmission_id: 'tid-456',
      transmission_time: '2024-06-01T12:00:00Z',
      cert_url: 'https://api.paypal.com/v1/notifications/certs/CERT-2',
      auth_algo: 'SHA256withRSA',
      transmission_sig: 'sig-xyz',
      webhook_id: 'wh-id-789',
      webhook_event: SAMPLE_EVENT,
    });
  });
});

describe('client.verifyWebhook', () => {
  const webhookHeaders = {
    'paypal-transmission-id': 'tid-1',
    'paypal-transmission-time': '2024-01-01T00:00:00Z',
    'paypal-transmission-sig': 'sig-1',
    'paypal-cert-url': 'https://api.paypal.com/v1/notifications/certs/CERT-1',
    'paypal-auth-algo': 'SHA256withRSA',
  };

  it('sends POST to verify-webhook-signature endpoint with correct body and returns verification_status', async () => {
    const capturedRequests: Array<{ url: string; body: unknown }> = [];

    const fetchMock = vi.fn(async (input: FetchRequestInput, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/v1/oauth2/token')) {
        return createJsonResponse({ access_token: 'tok', expires_in: 3600 });
      }
      const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined;
      capturedRequests.push({ url, body });
      return createJsonResponse({ verification_status: 'SUCCESS' });
    });

    const client = createPayPalClient({
      clientId: 'id',
      clientSecret: 'secret',
      baseUrl: 'https://paypal.test/',
      webhookId: 'wh-id-123',
      fetch: fetchMock,
    });

    const result = await client.verifyWebhook({
      headers: webhookHeaders,
      event: SAMPLE_EVENT,
    });

    expect(result.verification_status).toBe('SUCCESS');

    const req = capturedRequests[0];
    if (!req) throw new Error('Expected a capture request.');
    expect(req.url).toBe('https://paypal.test/v1/notifications/verify-webhook-signature');

    const reqBody = req.body as Record<string, unknown>;
    expect(reqBody['transmission_id']).toBe('tid-1');
    expect(reqBody['webhook_id']).toBe('wh-id-123');
    expect(reqBody['webhook_event']).toEqual(SAMPLE_EVENT);
  });

  it('uses webhookId passed in the call parameter over the client-level webhookId', async () => {
    const capturedRequests: Array<{ url: string; body: unknown }> = [];

    const fetchMock = vi.fn(async (input: FetchRequestInput, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/v1/oauth2/token')) {
        return createJsonResponse({ access_token: 'tok', expires_in: 3600 });
      }
      const body = typeof init?.body === 'string' ? (JSON.parse(init.body) as unknown) : undefined;
      capturedRequests.push({ url, body });
      return createJsonResponse({ verification_status: 'SUCCESS' });
    });

    const client = createPayPalClient({
      clientId: 'id',
      clientSecret: 'secret',
      baseUrl: 'https://paypal.test/',
      webhookId: 'client-level-wh-id',
      fetch: fetchMock,
    });

    await client.verifyWebhook({
      headers: webhookHeaders,
      event: SAMPLE_EVENT,
      webhookId: 'call-level-wh-id',
    });

    const req = capturedRequests[0];
    if (!req) throw new Error('Expected a capture request.');
    const reqBody = req.body as Record<string, unknown>;
    expect(reqBody['webhook_id']).toBe('call-level-wh-id');
  });

  it('throws PayPalApiError with code missing_webhook_id when no webhookId is configured', async () => {
    const fetchMock = vi.fn(async (input: FetchRequestInput) => {
      if (String(input).includes('/v1/oauth2/token')) {
        return createJsonResponse({ access_token: 'tok', expires_in: 3600 });
      }
      return createJsonResponse({});
    });

    const client = createPayPalClient({
      clientId: 'id',
      clientSecret: 'secret',
      baseUrl: 'https://paypal.test/',
      fetch: fetchMock,
    });

    await expect(
      client.verifyWebhook({ headers: webhookHeaders, event: SAMPLE_EVENT }),
    ).rejects.toMatchObject({
      name: 'PayPalApiError',
      code: 'missing_webhook_id',
    } satisfies Partial<PayPalApiError>);
  });
});
