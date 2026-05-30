import type { HttpClient } from '../core/http-client.js';
import type { OperationQueryOf, OperationRequestBodyOf, OperationResponseOf } from '../core/openapi.js';
import type { operations } from '../generated/webhooks.js';

export class WebhooksResource {
  constructor(private readonly httpClient: HttpClient) {}

  create(
    body: OperationRequestBodyOf<operations['webhooks.post']>,
  ): Promise<OperationResponseOf<operations['webhooks.post']>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/v1/notifications/webhooks',
      body,
    });
  }

  list(
    query?: OperationQueryOf<operations['webhooks.list']>,
  ): Promise<OperationResponseOf<operations['webhooks.list']>> {
    return this.httpClient.request({
      method: 'GET',
      path: '/v1/notifications/webhooks',
      query,
    });
  }

  get(id: string): Promise<OperationResponseOf<operations['webhooks.get']>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/v1/notifications/webhooks/${encodeURIComponent(id)}`,
    });
  }

  update(
    id: string,
    body: OperationRequestBodyOf<operations['webhooks.update']>,
  ): Promise<OperationResponseOf<operations['webhooks.update']>> {
    return this.httpClient.request({
      method: 'PATCH',
      path: `/v1/notifications/webhooks/${encodeURIComponent(id)}`,
      body,
    });
  }

  delete(id: string): Promise<OperationResponseOf<operations['webhooks.delete']>> {
    return this.httpClient.request({
      method: 'DELETE',
      path: `/v1/notifications/webhooks/${encodeURIComponent(id)}`,
    });
  }

  listEventTypes(
    webhookId: string,
  ): Promise<OperationResponseOf<operations['event-types.list']>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/v1/notifications/webhooks/${encodeURIComponent(webhookId)}/event-types`,
    });
  }

  listAvailableEventTypes(): Promise<OperationResponseOf<operations['webhooks-event-types.list']>> {
    return this.httpClient.request({
      method: 'GET',
      path: '/v1/notifications/webhooks-event-types',
    });
  }

  verifySignature(
    body: OperationRequestBodyOf<operations['verify-webhook-signature.post']>,
  ): Promise<OperationResponseOf<operations['verify-webhook-signature.post']>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/v1/notifications/verify-webhook-signature',
      body,
    });
  }

  listEventNotifications(
    query?: OperationQueryOf<operations['webhooks-events.list']>,
  ): Promise<OperationResponseOf<operations['webhooks-events.list']>> {
    return this.httpClient.request({
      method: 'GET',
      path: '/v1/notifications/webhooks-events',
      query,
    });
  }

  getEvent(eventId: string): Promise<OperationResponseOf<operations['webhooks-events.get']>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/v1/notifications/webhooks-events/${encodeURIComponent(eventId)}`,
    });
  }

  resendEvent(
    eventId: string,
    body?: OperationRequestBodyOf<operations['webhooks-events.resend']>,
  ): Promise<OperationResponseOf<operations['webhooks-events.resend']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v1/notifications/webhooks-events/${encodeURIComponent(eventId)}/resend`,
      body,
    });
  }

  simulateEvent(
    body?: OperationRequestBodyOf<operations['simulate-event.post']>,
  ): Promise<OperationResponseOf<operations['simulate-event.post']>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/v1/notifications/simulate-event',
      body,
    });
  }
}
