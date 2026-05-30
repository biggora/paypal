export { PayPalClient, createPayPalClient } from './client.js';
export { PayPalApiError } from './core/error.js';
export type { PayPalApiErrorOptions } from './core/error.js';
export type {
  FetchLike,
  FetchRequestInput,
  PayPalClientOptions,
  RequestOptions,
} from './core/http-client.js';
export type {
  JsonRecord,
  PayPalEnvironment,
  QueryRecord,
} from './core/types.js';
export type {
  OperationPathOf,
  OperationQueryOf,
  OperationRequestBodyOf,
  OperationResponseOf,
} from './core/openapi.js';
export {
  buildVerifyWebhookPayload,
  extractTransmissionHeaders,
  parseWebhookEvent,
} from './core/webhook.js';
export type {
  PayPalWebhookEvent,
  VerifyWebhookPayload,
  WebhookTransmissionHeaders,
} from './core/webhook.js';

export { InvoicesResource } from './resources/invoices.js';
export { OrdersResource } from './resources/orders.js';
export { PaymentsResource } from './resources/payments.js';
export { PayoutsResource } from './resources/payouts.js';
export { PlansResource } from './resources/plans.js';
export { ProductsResource } from './resources/products.js';
export { SubscriptionsResource } from './resources/subscriptions.js';
export { WebhooksResource } from './resources/webhooks.js';

export type * as InvoicingSchema from './generated/invoicing.js';
export type * as OrdersSchema from './generated/orders.js';
export type * as PaymentsSchema from './generated/payments.js';
export type * as PayoutsSchema from './generated/payouts.js';
export type * as ProductsSchema from './generated/products.js';
export type * as SubscriptionsSchema from './generated/subscriptions.js';
export type * as WebhooksSchema from './generated/webhooks.js';
