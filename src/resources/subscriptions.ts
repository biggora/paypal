import type { HttpClient } from '../core/http-client.js';
import type { OperationQueryOf, OperationRequestBodyOf, OperationResponseOf } from '../core/openapi.js';
import type { operations } from '../generated/subscriptions.js';

export class SubscriptionsResource {
  constructor(private readonly httpClient: HttpClient) {}

  create(
    body: OperationRequestBodyOf<operations['subscriptions.create']>,
    headers?: Record<string, string>,
  ): Promise<OperationResponseOf<operations['subscriptions.create']>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/v1/billing/subscriptions',
      body,
      headers,
    });
  }

  get(
    id: string,
    query?: OperationQueryOf<operations['subscriptions.get']>,
  ): Promise<OperationResponseOf<operations['subscriptions.get']>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/v1/billing/subscriptions/${encodeURIComponent(id)}`,
      query,
    });
  }

  update(
    id: string,
    body: OperationRequestBodyOf<operations['subscriptions.patch']>,
  ): Promise<OperationResponseOf<operations['subscriptions.patch']>> {
    return this.httpClient.request({
      method: 'PATCH',
      path: `/v1/billing/subscriptions/${encodeURIComponent(id)}`,
      body,
    });
  }

  revise(
    id: string,
    body: OperationRequestBodyOf<operations['subscriptions.revise']>,
  ): Promise<OperationResponseOf<operations['subscriptions.revise']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v1/billing/subscriptions/${encodeURIComponent(id)}/revise`,
      body,
    });
  }

  activate(
    id: string,
    body?: OperationRequestBodyOf<operations['subscriptions.activate']>,
  ): Promise<OperationResponseOf<operations['subscriptions.activate']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v1/billing/subscriptions/${encodeURIComponent(id)}/activate`,
      body,
    });
  }

  suspend(
    id: string,
    body?: OperationRequestBodyOf<operations['subscriptions.suspend']>,
  ): Promise<OperationResponseOf<operations['subscriptions.suspend']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v1/billing/subscriptions/${encodeURIComponent(id)}/suspend`,
      body,
    });
  }

  cancel(
    id: string,
    body?: OperationRequestBodyOf<operations['subscriptions.cancel']>,
  ): Promise<OperationResponseOf<operations['subscriptions.cancel']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v1/billing/subscriptions/${encodeURIComponent(id)}/cancel`,
      body,
    });
  }

  capture(
    id: string,
    body: OperationRequestBodyOf<operations['subscriptions.capture']>,
  ): Promise<OperationResponseOf<operations['subscriptions.capture']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v1/billing/subscriptions/${encodeURIComponent(id)}/capture`,
      body,
    });
  }

  listTransactions(
    id: string,
    query: OperationQueryOf<operations['subscriptions.transactions']>,
  ): Promise<OperationResponseOf<operations['subscriptions.transactions']>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/v1/billing/subscriptions/${encodeURIComponent(id)}/transactions`,
      query,
    });
  }
}
