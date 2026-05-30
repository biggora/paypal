import { PayPalApiError, createPayPalApiError, createPayPalRequestError } from './error.js';
import type { FetchLike, FetchRequestInput, PayPalClientOptions, RequestOptions } from './types.js';

export type { FetchLike, FetchRequestInput, PayPalClientOptions, RequestOptions };

type TokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

type CachedToken = {
  accessToken: string;
  expiresAt: number;
};

const BASE_URLS: Record<'sandbox' | 'live', string> = {
  sandbox: 'https://api-m.sandbox.paypal.com/',
  live: 'https://api-m.paypal.com/',
};

export class HttpClient {
  readonly clientId: string;
  readonly baseUrl: string;
  readonly webhookId: string | undefined;
  readonly timeoutMs: number;
  private readonly clientSecret: string;
  private cachedToken: CachedToken | undefined;
  private tokenRequest: Promise<CachedToken> | undefined;
  private readonly fetchImpl: FetchLike;

  constructor(options: PayPalClientOptions) {
    this.clientId = options.clientId;
    this.clientSecret = options.clientSecret;
    this.webhookId = options.webhookId;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);

    if (options.baseUrl) {
      this.baseUrl = ensureTrailingSlash(options.baseUrl);
    } else {
      const env = options.environment ?? 'sandbox';
      this.baseUrl = BASE_URLS[env];
    }
  }

  async request<TResponse, TBody = unknown>(options: RequestOptions<TBody>): Promise<TResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const combinedSignal = options.signal
      ? AbortSignal.any([controller.signal, options.signal])
      : controller.signal;

    try {
      const init: RequestInit = {
        method: options.method,
        headers: await this.buildHeaders(options.body, options.skipAuth ?? false, options.headers),
        signal: combinedSignal,
      };
      if (options.body !== undefined) {
        init.body = JSON.stringify(options.body);
      }

      const response = await this.fetchImpl(this.buildUrl(options), init);

      if (!response.ok) {
        throw await createPayPalApiError(response);
      }

      if (response.status === 204) {
        return undefined as TResponse;
      }

      const contentType = response.headers.get('content-type') ?? '';
      if (!contentType.includes('application/json')) {
        return undefined as TResponse;
      }

      return await response.json() as TResponse;
    } catch (error) {
      throw error instanceof PayPalApiError ? error : createPayPalRequestError(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && this.cachedToken.expiresAt > now + 30_000) {
      return this.cachedToken.accessToken;
    }

    this.tokenRequest ??= this.fetchAccessToken();
    try {
      this.cachedToken = await this.tokenRequest;
      return this.cachedToken.accessToken;
    } finally {
      this.tokenRequest = undefined;
    }
  }

  clearAccessToken(): void {
    this.cachedToken = undefined;
    this.tokenRequest = undefined;
  }

  private async fetchAccessToken(): Promise<CachedToken> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      const body = new URLSearchParams({ grant_type: 'client_credentials' });

      const response = await this.fetchImpl(`${this.baseUrl}v1/oauth2/token`, {
        method: 'POST',
        headers: new Headers({
          accept: 'application/json',
          authorization: `Basic ${credentials}`,
          'content-type': 'application/x-www-form-urlencoded',
        }),
        body,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw await createPayPalApiError(response);
      }

      let token: TokenResponse;
      try {
        token = await response.json() as TokenResponse;
      } catch {
        throw new PayPalApiError('PayPal OAuth token response was not valid JSON.', {
          code: 'invalid_token_response',
        });
      }
      if (!token.access_token) {
        throw new PayPalApiError('PayPal OAuth token response did not include access_token.', {
          code: 'invalid_token_response',
          raw: token,
        });
      }

      return {
        accessToken: token.access_token,
        expiresAt: Date.now() + (token.expires_in ?? 3600) * 1000,
      };
    } catch (error) {
      throw error instanceof PayPalApiError ? error : createPayPalRequestError(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(options: RequestOptions<unknown>): URL {
    const url = options.absoluteUrl
      ? new URL(options.absoluteUrl)
      : new URL(stripLeadingSlash(options.path ?? ''), this.baseUrl);

    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const entry of value) {
          url.searchParams.append(key, String(entry));
        }
        continue;
      }

      url.searchParams.set(key, String(value));
    }

    return url;
  }

  private async buildHeaders(
    body: unknown,
    skipAuth: boolean,
    extraHeaders: Record<string, string> | undefined,
  ): Promise<Headers> {
    const headers = new Headers({ accept: 'application/json' });

    if (!skipAuth) {
      headers.set('authorization', `Bearer ${await this.getAccessToken()}`);
    }

    if (body !== undefined) {
      headers.set('content-type', 'application/json');
    }

    if (extraHeaders) {
      for (const [key, value] of Object.entries(extraHeaders)) {
        headers.set(key, value);
      }
    }

    return headers;
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function stripLeadingSlash(value: string): string {
  return value.startsWith('/') ? value.slice(1) : value;
}

