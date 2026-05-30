export type PayPalApiErrorOptions = {
  status?: number | undefined;
  code?: string | undefined;
  debugId?: string | undefined;
  details?: unknown;
  links?: unknown;
  raw?: unknown;
  requestId?: string | null | undefined;
  cause?: unknown;
};

export class PayPalApiError extends Error {
  status: number | undefined;
  code: string | undefined;
  debugId: string | undefined;
  details: unknown;
  links: unknown;
  raw: unknown;
  requestId: string | null | undefined;

  constructor(message: string, options: PayPalApiErrorOptions = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = 'PayPalApiError';
    this.status = options.status;
    this.code = options.code;
    this.debugId = options.debugId;
    this.details = options.details;
    this.links = options.links;
    this.raw = options.raw;
    this.requestId = options.requestId;
  }
}

type ErrorRecord = Record<string, unknown>;

function isRecord(value: unknown): value is ErrorRecord {
  return typeof value === 'object' && value !== null;
}

function pickString(record: ErrorRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) {
      return value;
    }
  }

  return undefined;
}

export async function createPayPalApiError(response: Response): Promise<PayPalApiError> {
  const debugId =
    response.headers.get('paypal-debug-id') ??
    response.headers.get('x-debug-id') ??
    undefined;
  const requestId =
    response.headers.get('paypal-request-id') ??
    response.headers.get('x-request-id') ??
    undefined;
  const contentType = response.headers.get('content-type') ?? '';
  let raw: unknown;

  if (contentType.includes('application/json')) {
    try {
      raw = await response.json();
    } catch {
      raw = undefined;
    }
  } else {
    const text = await response.text();
    raw = text.length > 0 ? text : undefined;
  }

  const record = isRecord(raw) ? raw : undefined;
  // PayPal error format: { name, message, debug_id, details, links }
  const message = record
    ? pickString(record, ['message', 'error_description', 'detail', 'description', 'name'])
    : undefined;
  const code = record ? pickString(record, ['name', 'error', 'code']) : undefined;
  const details = record?.details ?? raw;
  const links = record?.links;
  const paypalDebugId = (record ? pickString(record, ['debug_id']) : undefined) ?? debugId;

  return new PayPalApiError(message ?? response.statusText ?? 'PayPal API request failed.', {
    status: response.status,
    code,
    debugId: paypalDebugId,
    details,
    links,
    raw,
    requestId,
  });
}

export function createPayPalRequestError(error: unknown): PayPalApiError {
  if (error instanceof PayPalApiError) {
    return error;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new PayPalApiError('PayPal API request timed out.', {
      code: 'request_timeout',
      cause: error,
    });
  }

  return new PayPalApiError(
    error instanceof Error ? error.message : 'PayPal API request failed.',
    {
      code: 'network_error',
      cause: error,
    },
  );
}
