import type { HttpClient } from '../core/http-client.js';
import type { OperationQueryOf, OperationRequestBodyOf, OperationResponseOf } from '../core/openapi.js';
import type { operations } from '../generated/subscriptions.js';

export class PlansResource {
  constructor(private readonly httpClient: HttpClient) {}

  create(
    body: OperationRequestBodyOf<operations['plans.create']>,
    headers?: Record<string, string>,
  ): Promise<OperationResponseOf<operations['plans.create']>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/v1/billing/plans',
      body,
      headers,
    });
  }

  list(
    query?: OperationQueryOf<operations['plans.list']>,
  ): Promise<OperationResponseOf<operations['plans.list']>> {
    return this.httpClient.request({
      method: 'GET',
      path: '/v1/billing/plans',
      query,
    });
  }

  get(id: string): Promise<OperationResponseOf<operations['plans.get']>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/v1/billing/plans/${encodeURIComponent(id)}`,
    });
  }

  update(
    id: string,
    body: OperationRequestBodyOf<operations['plans.patch']>,
  ): Promise<OperationResponseOf<operations['plans.patch']>> {
    return this.httpClient.request({
      method: 'PATCH',
      path: `/v1/billing/plans/${encodeURIComponent(id)}`,
      body,
    });
  }

  activate(id: string): Promise<OperationResponseOf<operations['plans.activate']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v1/billing/plans/${encodeURIComponent(id)}/activate`,
    });
  }

  deactivate(id: string): Promise<OperationResponseOf<operations['plans.deactivate']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v1/billing/plans/${encodeURIComponent(id)}/deactivate`,
    });
  }

  updatePricingSchemes(
    id: string,
    body: OperationRequestBodyOf<operations['plans.update-pricing-schemes']>,
  ): Promise<OperationResponseOf<operations['plans.update-pricing-schemes']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v1/billing/plans/${encodeURIComponent(id)}/update-pricing-schemes`,
      body,
    });
  }
}
