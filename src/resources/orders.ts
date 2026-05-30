import type { HttpClient } from '../core/http-client.js';
import type { OperationRequestBodyOf, OperationResponseOf } from '../core/openapi.js';
import type { operations } from '../generated/orders.js';

export class OrdersResource {
  constructor(private readonly httpClient: HttpClient) {}

  create(
    body: OperationRequestBodyOf<operations['orders.create']>,
    headers?: Record<string, string>,
  ): Promise<OperationResponseOf<operations['orders.create']>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/v2/checkout/orders',
      body,
      headers,
    });
  }

  get(id: string): Promise<OperationResponseOf<operations['orders.get']>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/v2/checkout/orders/${encodeURIComponent(id)}`,
    });
  }

  update(
    id: string,
    body: OperationRequestBodyOf<operations['orders.patch']>,
  ): Promise<OperationResponseOf<operations['orders.patch']>> {
    return this.httpClient.request({
      method: 'PATCH',
      path: `/v2/checkout/orders/${encodeURIComponent(id)}`,
      body,
    });
  }

  confirmPaymentSource(
    id: string,
    body: OperationRequestBodyOf<operations['orders.confirm']>,
    headers?: Record<string, string>,
  ): Promise<OperationResponseOf<operations['orders.confirm']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v2/checkout/orders/${encodeURIComponent(id)}/confirm-payment-source`,
      body,
      headers,
    });
  }

  authorize(
    id: string,
    body?: OperationRequestBodyOf<operations['orders.authorize']>,
    headers?: Record<string, string>,
  ): Promise<OperationResponseOf<operations['orders.authorize']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v2/checkout/orders/${encodeURIComponent(id)}/authorize`,
      body,
      headers,
    });
  }

  capture(
    id: string,
    body?: OperationRequestBodyOf<operations['orders.capture']>,
    headers?: Record<string, string>,
  ): Promise<OperationResponseOf<operations['orders.capture']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v2/checkout/orders/${encodeURIComponent(id)}/capture`,
      body,
      headers,
    });
  }

  track(
    id: string,
    body: OperationRequestBodyOf<operations['orders.track.create']>,
    headers?: Record<string, string>,
  ): Promise<OperationResponseOf<operations['orders.track.create']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v2/checkout/orders/${encodeURIComponent(id)}/track`,
      body,
      headers,
    });
  }

  updateTracking(
    id: string,
    trackerId: string,
    body: OperationRequestBodyOf<operations['orders.trackers.patch']>,
  ): Promise<OperationResponseOf<operations['orders.trackers.patch']>> {
    return this.httpClient.request({
      method: 'PATCH',
      path: `/v2/checkout/orders/${encodeURIComponent(id)}/trackers/${encodeURIComponent(trackerId)}`,
      body,
    });
  }
}
