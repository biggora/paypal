import type { HttpClient } from '../core/http-client.js';
import type { OperationQueryOf, OperationRequestBodyOf, OperationResponseOf } from '../core/openapi.js';
import type { operations } from '../generated/payouts.js';

export class PayoutsResource {
  constructor(private readonly httpClient: HttpClient) {}

  create(
    body: OperationRequestBodyOf<operations['payouts.post']>,
    headers?: Record<string, string>,
  ): Promise<OperationResponseOf<operations['payouts.post']>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/v1/payments/payouts',
      body,
      headers,
    });
  }

  get(
    batchId: string,
    query?: OperationQueryOf<operations['payouts.get']>,
  ): Promise<OperationResponseOf<operations['payouts.get']>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/v1/payments/payouts/${encodeURIComponent(batchId)}`,
      query,
    });
  }

  getItem(itemId: string): Promise<OperationResponseOf<operations['payouts-item.get']>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/v1/payments/payouts-item/${encodeURIComponent(itemId)}`,
    });
  }

  cancelItem(itemId: string): Promise<OperationResponseOf<operations['payouts-item.cancel']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v1/payments/payouts-item/${encodeURIComponent(itemId)}/cancel`,
    });
  }
}
