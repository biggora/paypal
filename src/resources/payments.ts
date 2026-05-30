import type { HttpClient } from '../core/http-client.js';
import type { OperationRequestBodyOf, OperationResponseOf } from '../core/openapi.js';
import type { operations } from '../generated/payments.js';

export class PaymentsResource {
  constructor(private readonly httpClient: HttpClient) {}

  getAuthorization(id: string): Promise<OperationResponseOf<operations['authorizations.get']>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/v2/payments/authorizations/${encodeURIComponent(id)}`,
    });
  }

  captureAuthorization(
    id: string,
    body?: OperationRequestBodyOf<operations['authorizations.capture']>,
    headers?: Record<string, string>,
  ): Promise<OperationResponseOf<operations['authorizations.capture']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v2/payments/authorizations/${encodeURIComponent(id)}/capture`,
      body,
      headers,
    });
  }

  reauthorizeAuthorization(
    id: string,
    body?: OperationRequestBodyOf<operations['authorizations.reauthorize']>,
    headers?: Record<string, string>,
  ): Promise<OperationResponseOf<operations['authorizations.reauthorize']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v2/payments/authorizations/${encodeURIComponent(id)}/reauthorize`,
      body,
      headers,
    });
  }

  voidAuthorization(
    id: string,
    headers?: Record<string, string>,
  ): Promise<OperationResponseOf<operations['authorizations.void']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v2/payments/authorizations/${encodeURIComponent(id)}/void`,
      headers,
    });
  }

  getCapture(id: string): Promise<OperationResponseOf<operations['captures.get']>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/v2/payments/captures/${encodeURIComponent(id)}`,
    });
  }

  refundCapture(
    id: string,
    body?: OperationRequestBodyOf<operations['captures.refund']>,
    headers?: Record<string, string>,
  ): Promise<OperationResponseOf<operations['captures.refund']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v2/payments/captures/${encodeURIComponent(id)}/refund`,
      body,
      headers,
    });
  }

  getRefund(id: string): Promise<OperationResponseOf<operations['refunds.get']>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/v2/payments/refunds/${encodeURIComponent(id)}`,
    });
  }
}
