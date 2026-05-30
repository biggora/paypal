export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue };
export type JsonRecord = Record<string, JsonValue>;

export type QueryPrimitive = string | number | boolean;
export type QueryValue = QueryPrimitive | QueryPrimitive[] | null | undefined;
export type QueryRecord = Record<string, QueryValue>;

export type FetchRequestInput = string | URL | Request;
export type FetchLike = (input: FetchRequestInput, init?: RequestInit) => Promise<Response>;

export type PayPalEnvironment = 'sandbox' | 'live';

export type PayPalClientOptions = {
  clientId: string;
  clientSecret: string;
  environment?: PayPalEnvironment | undefined;
  baseUrl?: string | undefined;
  webhookId?: string | undefined;
  timeoutMs?: number | undefined;
  fetch?: FetchLike | undefined;
};

export type RequestOptions<TBody = unknown> = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path?: string | undefined;
  absoluteUrl?: string | undefined;
  query?: QueryRecord | undefined;
  body?: TBody | undefined;
  signal?: AbortSignal | undefined;
  skipAuth?: boolean | undefined;
  headers?: Record<string, string> | undefined;
};
