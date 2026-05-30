import { afterEach, describe, expect, it, vi } from 'vitest';

import { PayPalApiError, createPayPalClient } from '../src/index.js';
import type { FetchRequestInput } from '../src/index.js';

function createJsonResponse(body: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
    ...init,
  });
}

function createTokenResponse(accessToken = 'token-1', expiresIn = 3600): Response {
  return createJsonResponse({ access_token: accessToken, token_type: 'Bearer', expires_in: expiresIn });
}

describe('PayPalClient core behavior', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('requests OAuth token with Basic auth and grant_type, then uses Bearer on API calls', async () => {
    const fetchMock = vi.fn(async (input: FetchRequestInput, init?: RequestInit) => {
      const url = String(input);
      if (url.includes('/v1/oauth2/token')) {
        expect(init?.method).toBe('POST');
        const authHeader = new Headers(init?.headers as never).get('authorization') ?? '';
        expect(authHeader).toMatch(/^Basic /);
        const decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf8');
        expect(decoded).toBe('my-client-id:my-client-secret');
        expect(init?.body).toBeInstanceOf(URLSearchParams);
        expect((init?.body as URLSearchParams).get('grant_type')).toBe('client_credentials');
        const contentType = new Headers(init?.headers as never).get('content-type') ?? '';
        expect(contentType).toBe('application/x-www-form-urlencoded');
        return createTokenResponse('access-token-abc');
      }
      return createJsonResponse({ id: 'order-1' });
    });

    const client = createPayPalClient({
      clientId: 'my-client-id',
      clientSecret: 'my-client-secret',
      baseUrl: 'https://paypal.test/',
      fetch: fetchMock,
    });

    await client.orders.get('order-1');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const apiCall = fetchMock.mock.calls[1];
    if (!apiCall) throw new Error('Expected second fetch call.');

    const [, apiInit] = apiCall;
    const headers = new Headers(apiInit?.headers as never);
    expect(headers.get('authorization')).toBe('Bearer access-token-abc');
  });

  it('resolves baseUrl for sandbox environment (default)', async () => {
    const fetchMock = vi.fn(async (input: FetchRequestInput) => {
      const url = String(input);
      if (url.includes('/v1/oauth2/token')) return createTokenResponse();
      return createJsonResponse({ id: 'order-1' });
    });

    const client = createPayPalClient({
      clientId: 'id',
      clientSecret: 'secret',
      fetch: fetchMock,
    });

    await client.orders.get('order-1');

    const tokenCall = fetchMock.mock.calls[0];
    if (!tokenCall) throw new Error('Expected token call.');
    expect(String(tokenCall[0])).toBe('https://api-m.sandbox.paypal.com/v1/oauth2/token');

    const apiCall = fetchMock.mock.calls[1];
    if (!apiCall) throw new Error('Expected API call.');
    expect(String(apiCall[0])).toContain('https://api-m.sandbox.paypal.com/');
  });

  it('resolves baseUrl for live environment', async () => {
    const fetchMock = vi.fn(async (input: FetchRequestInput) => {
      const url = String(input);
      if (url.includes('/v1/oauth2/token')) return createTokenResponse();
      return createJsonResponse({ id: 'order-1' });
    });

    const client = createPayPalClient({
      clientId: 'id',
      clientSecret: 'secret',
      environment: 'live',
      fetch: fetchMock,
    });

    await client.orders.get('order-1');

    const tokenCall = fetchMock.mock.calls[0];
    if (!tokenCall) throw new Error('Expected token call.');
    expect(String(tokenCall[0])).toBe('https://api-m.paypal.com/v1/oauth2/token');
  });

  it('respects baseUrl override regardless of environment', async () => {
    const fetchMock = vi.fn(async (input: FetchRequestInput) => {
      const url = String(input);
      if (url.includes('/v1/oauth2/token')) return createTokenResponse();
      return createJsonResponse({ id: 'order-1' });
    });

    const client = createPayPalClient({
      clientId: 'id',
      clientSecret: 'secret',
      environment: 'live',
      baseUrl: 'https://custom.paypal.test/',
      fetch: fetchMock,
    });

    await client.orders.get('order-1');

    const tokenCall = fetchMock.mock.calls[0];
    if (!tokenCall) throw new Error('Expected token call.');
    expect(String(tokenCall[0])).toBe('https://custom.paypal.test/v1/oauth2/token');

    const apiCall = fetchMock.mock.calls[1];
    if (!apiCall) throw new Error('Expected API call.');
    expect(String(apiCall[0])).toContain('https://custom.paypal.test/');
  });

  it('caches the token and only fetches it once across multiple API calls', async () => {
    const fetchMock = vi.fn(async (input: FetchRequestInput) => {
      if (String(input).includes('/v1/oauth2/token')) return createTokenResponse('tok', 3600);
      return createJsonResponse({ id: 'order-1' });
    });

    const client = createPayPalClient({
      clientId: 'id',
      clientSecret: 'secret',
      baseUrl: 'https://paypal.test/',
      fetch: fetchMock,
    });

    await client.orders.get('order-1');
    await client.orders.get('order-2');

    const tokenCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes('/v1/oauth2/token'),
    );
    expect(tokenCalls).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('re-fetches the token after expires_in elapses', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn(async (input: FetchRequestInput) => {
      if (String(input).includes('/v1/oauth2/token')) {
        return createTokenResponse(`token-${fetchMock.mock.calls.length}`, 60);
      }
      return createJsonResponse({ id: 'order-1' });
    });

    const client = createPayPalClient({
      clientId: 'id',
      clientSecret: 'secret',
      baseUrl: 'https://paypal.test/',
      fetch: fetchMock,
    });

    await client.orders.get('order-1');
    // advance past the 60s expiry minus the 30s buffer = expires at now+60000, cached invalid after now+30000
    vi.advanceTimersByTime(31_000);
    await client.orders.get('order-2');

    const tokenCalls = fetchMock.mock.calls.filter(([input]) =>
      String(input).includes('/v1/oauth2/token'),
    );
    expect(tokenCalls).toHaveLength(2);
  });

  it('normalizes a PayPal API error response into PayPalApiError with status, code, and debugId', async () => {
    const fetchMock = vi.fn(async (input: FetchRequestInput) => {
      if (String(input).includes('/v1/oauth2/token')) return createTokenResponse();
      return createJsonResponse(
        { name: 'INVALID_REQUEST', message: 'Request is not well-formed.', debug_id: 'dbg-xyz' },
        {
          status: 400,
          headers: {
            'content-type': 'application/json',
            'paypal-debug-id': 'dbg-xyz',
          },
        },
      );
    });

    const client = createPayPalClient({
      clientId: 'id',
      clientSecret: 'secret',
      baseUrl: 'https://paypal.test/',
      fetch: fetchMock,
    });

    await expect(client.orders.get('order-1')).rejects.toMatchObject({
      name: 'PayPalApiError',
      status: 400,
      code: 'INVALID_REQUEST',
      message: 'Request is not well-formed.',
      debugId: 'dbg-xyz',
    } satisfies Partial<PayPalApiError>);
  });

  it('throws PayPalApiError with code request_timeout when fetch aborts due to timeout', async () => {
    const fetchMock = vi.fn(
      async (_input: FetchRequestInput, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );

    const client = createPayPalClient({
      clientId: 'id',
      clientSecret: 'secret',
      baseUrl: 'https://paypal.test/',
      timeoutMs: 10,
      fetch: fetchMock,
    });

    await expect(client.getAccessToken()).rejects.toMatchObject({
      name: 'PayPalApiError',
      code: 'request_timeout',
    } satisfies Partial<PayPalApiError>);
  });

  it('forwards custom headers (e.g. PayPal-Request-Id) to the API call', async () => {
    const fetchMock = vi.fn(async (input: FetchRequestInput, _init?: RequestInit) => {
      if (String(input).includes('/v1/oauth2/token')) return createTokenResponse();
      return createJsonResponse({ id: 'order-1' });
    });

    const client = createPayPalClient({
      clientId: 'id',
      clientSecret: 'secret',
      baseUrl: 'https://paypal.test/',
      fetch: fetchMock,
    });

    await client.orders.create({ intent: 'CAPTURE', purchase_units: [] } as never, {
      'PayPal-Request-Id': 'req-id-123',
    });

    const apiCall = fetchMock.mock.calls[1];
    if (!apiCall) throw new Error('Expected API call.');
    const [, apiInit] = apiCall;
    const headers = new Headers(apiInit?.headers as never);
    expect(headers.get('paypal-request-id')).toBe('req-id-123');
  });
});
