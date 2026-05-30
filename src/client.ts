import { PayPalApiError } from './core/error.js';
import { HttpClient } from './core/http-client.js';
import type { PayPalClientOptions, RequestOptions } from './core/http-client.js';
import { buildVerifyWebhookPayload } from './core/webhook.js';
import type { OperationRequestBodyOf } from './core/openapi.js';
import type { operations as WebhookOperations } from './generated/webhooks.js';
import { InvoicesResource } from './resources/invoices.js';
import { OrdersResource } from './resources/orders.js';
import { PaymentsResource } from './resources/payments.js';
import { PayoutsResource } from './resources/payouts.js';
import { PlansResource } from './resources/plans.js';
import { ProductsResource } from './resources/products.js';
import { SubscriptionsResource } from './resources/subscriptions.js';
import { WebhooksResource } from './resources/webhooks.js';

export class PayPalClient {
  readonly invoices: InvoicesResource;
  readonly orders: OrdersResource;
  readonly payments: PaymentsResource;
  readonly payouts: PayoutsResource;
  readonly plans: PlansResource;
  readonly products: ProductsResource;
  readonly subscriptions: SubscriptionsResource;
  readonly webhooks: WebhooksResource;
  private readonly httpClient: HttpClient;

  constructor(options: PayPalClientOptions) {
    this.httpClient = new HttpClient(options);
    this.invoices = new InvoicesResource(this.httpClient);
    this.orders = new OrdersResource(this.httpClient);
    this.payments = new PaymentsResource(this.httpClient);
    this.payouts = new PayoutsResource(this.httpClient);
    this.plans = new PlansResource(this.httpClient);
    this.products = new ProductsResource(this.httpClient);
    this.subscriptions = new SubscriptionsResource(this.httpClient);
    this.webhooks = new WebhooksResource(this.httpClient);
  }

  getAccessToken(): Promise<string> {
    return this.httpClient.getAccessToken();
  }

  clearAccessToken(): void {
    this.httpClient.clearAccessToken();
  }

  request<TResponse, TBody = unknown>(options: RequestOptions<TBody>): Promise<TResponse> {
    return this.httpClient.request<TResponse, TBody>(options);
  }

  async verifyWebhook(params: {
    headers: Record<string, string | string[] | undefined> | Headers;
    event: unknown;
    webhookId?: string | undefined;
  }) {
    const webhookId = params.webhookId ?? this.httpClient.webhookId;
    if (!webhookId) {
      throw new PayPalApiError(
        'webhookId is required for webhook verification. Provide it via PayPalClientOptions.webhookId or the webhookId parameter.',
        { code: 'missing_webhook_id' },
      );
    }

    const payload = buildVerifyWebhookPayload({
      headers: params.headers,
      webhookId,
      event: params.event,
    }) as OperationRequestBodyOf<WebhookOperations['verify-webhook-signature.post']>;

    return this.webhooks.verifySignature(payload);
  }
}

export function createPayPalClient(options: PayPalClientOptions): PayPalClient {
  return new PayPalClient(options);
}
