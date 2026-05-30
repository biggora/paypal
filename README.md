# @biggora/paypal

[![npm version](https://img.shields.io/npm/v/@biggora/paypal.svg)](https://www.npmjs.com/package/@biggora/paypal)
[![Unit Tests](https://github.com/biggora/paypal/actions/workflows/unit-tests.yml/badge.svg)](https://github.com/biggora/paypal/actions/workflows/unit-tests.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

TypeScript SDK and NestJS adapter for the [PayPal REST API](https://developer.paypal.com/api/rest/).

Targets Node.js `20+`. Ships dual `ESM`/`CommonJS` builds and a first-class NestJS subpath export. All request and response bodies are strictly typed from PayPal's official OpenAPI specifications.

## Install

```bash
npm install @biggora/paypal
```

NestJS apps also need peer deps:

```bash
npm install @nestjs/common @nestjs/core reflect-metadata rxjs
```

## Quick Start: Checkout

Create an order with intent `CAPTURE`, redirect the buyer to the approval link, then capture the order once the buyer approves.

```ts
import { createPayPalClient } from '@biggora/paypal';

const paypal = createPayPalClient({
  clientId: process.env.PAYPAL_CLIENT_ID!,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  environment: 'sandbox',
});

const order = await paypal.orders.create({
  intent: 'CAPTURE',
  purchase_units: [
    {
      reference_id: 'order-1001',
      amount: {
        currency_code: 'USD',
        value: '49.99',
      },
    },
  ],
  payment_source: {
    paypal: {
      experience_context: {
        return_url: 'https://shop.example/checkout/success',
        cancel_url: 'https://shop.example/checkout/cancel',
      },
    },
  },
});

const approveLink = order.links?.find((link) => link.rel === 'payer-action');
console.log(approveLink?.href);

// After the buyer approves, capture the funds.
const captured = await paypal.orders.capture(order.id!);
console.log(captured.status); // COMPLETED
```

OAuth2 (`client_credentials`) authentication and access-token caching are handled automatically on the first request.

## Configuration

`createPayPalClient(options)` accepts:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `clientId` | `string` | — | PayPal REST app client ID (required). |
| `clientSecret` | `string` | — | PayPal REST app secret (required). |
| `environment` | `'sandbox' \| 'live'` | `'sandbox'` | Selects the PayPal base URL. |
| `baseUrl` | `string` | — | Overrides the base URL. Takes precedence over `environment`. |
| `webhookId` | `string` | — | Default webhook ID used by `verifyWebhook`. |
| `timeoutMs` | `number` | `30000` | Per-request timeout in milliseconds. |
| `fetch` | `FetchLike` | global `fetch` | Custom fetch implementation for testing or proxies. |

Base URLs: sandbox `https://api-m.sandbox.paypal.com`, live `https://api-m.paypal.com`.

The client obtains an OAuth2 token via `client_credentials` and caches it until shortly before expiry, refreshing transparently. Call `paypal.getAccessToken()` to read the current token or `paypal.clearAccessToken()` to force a refresh.

## Orders

```ts
const order = await paypal.orders.create({
  intent: 'AUTHORIZE',
  purchase_units: [{ amount: { currency_code: 'USD', value: '25.00' } }],
});

const fetched = await paypal.orders.get(order.id!);

await paypal.orders.update(order.id!, [
  { op: 'replace', path: "/purchase_units/@reference_id=='default'/amount", value: { currency_code: 'USD', value: '30.00' } },
]);

await paypal.orders.authorize(order.id!);
await paypal.orders.confirmPaymentSource(order.id!, {
  payment_source: { paypal: {} },
});

// Add shipment tracking after capture.
await paypal.orders.track(order.id!, {
  capture_id: 'CAPTURE-ID',
  tracking_number: '1Z9999',
  carrier: 'UPS',
});
await paypal.orders.updateTracking(order.id!, 'TRACKER-ID', [
  { op: 'replace', path: '/status', value: 'SHIPPED' },
]);
```

## Payments & Refunds

Work with the authorizations, captures, and refunds created by orders.

```ts
// Authorizations
const auth = await paypal.payments.getAuthorization('AUTH-ID');
const capture = await paypal.payments.captureAuthorization('AUTH-ID', {
  amount: { currency_code: 'USD', value: '49.99' },
  final_capture: true,
});
await paypal.payments.reauthorizeAuthorization('AUTH-ID');
await paypal.payments.voidAuthorization('AUTH-ID');

// Captures and refunds
const settled = await paypal.payments.getCapture(capture.id!);
const refund = await paypal.payments.refundCapture(capture.id!, {
  amount: { currency_code: 'USD', value: '49.99' },
  note_to_payer: 'Order canceled',
});
const refundDetails = await paypal.payments.getRefund(refund.id!);
```

## Subscriptions & Plans

```ts
// Catalog plan
const plan = await paypal.plans.create({
  product_id: 'PROD-XXXX',
  name: 'Pro Monthly',
  billing_cycles: [
    {
      frequency: { interval_unit: 'MONTH', interval_count: 1 },
      tenure_type: 'REGULAR',
      sequence: 1,
      total_cycles: 0,
      pricing_scheme: { fixed_price: { currency_code: 'USD', value: '19.99' } },
    },
  ],
  payment_preferences: { auto_bill_outstanding: true },
});

await paypal.plans.activate(plan.id!);
const plans = await paypal.plans.list({ page_size: 20 });

// Subscription
const subscription = await paypal.subscriptions.create({
  plan_id: plan.id!,
  subscriber: { email_address: 'customer@example.com' },
});

await paypal.subscriptions.suspend(subscription.id!, { reason: 'Customer request' });
await paypal.subscriptions.activate(subscription.id!, { reason: 'Reactivated' });
await paypal.subscriptions.cancel(subscription.id!, { reason: 'No longer needed' });

const transactions = await paypal.subscriptions.listTransactions(subscription.id!, {
  start_time: '2026-01-01T00:00:00Z',
  end_time: '2026-02-01T00:00:00Z',
});
```

## Payouts

```ts
const batch = await paypal.payouts.create({
  sender_batch_header: {
    sender_batch_id: 'batch-2026-05-01',
    email_subject: 'You have a payout!',
  },
  items: [
    {
      recipient_type: 'EMAIL',
      amount: { currency: 'USD', value: '10.00' },
      receiver: 'receiver@example.com',
      note: 'Thanks for your business.',
    },
  ],
});

const batchId = batch.batch_header?.payout_batch_id!;
const status = await paypal.payouts.get(batchId, { page_size: 100 });

const item = await paypal.payouts.getItem('ITEM-ID');
await paypal.payouts.cancelItem('ITEM-ID');
```

## Catalog Products

```ts
const product = await paypal.products.create({
  name: 'Video Streaming Service',
  type: 'SERVICE',
  category: 'SOFTWARE',
});

const products = await paypal.products.list({ page_size: 10 });
const fetched = await paypal.products.get(product.id!);

await paypal.products.update(product.id!, [
  { op: 'replace', path: '/description', value: 'Premium plan' },
]);
```

## Invoicing

```ts
const number = await paypal.invoices.generateInvoiceNumber();

const invoice = await paypal.invoices.create({
  detail: {
    invoice_number: number.invoice_number,
    currency_code: 'USD',
  },
  items: [
    {
      name: 'Consulting',
      quantity: '1',
      unit_amount: { currency_code: 'USD', value: '500.00' },
    },
  ],
});

await paypal.invoices.send(invoice.href!.split('/').pop()!, { send_to_invoicer: true });
await paypal.invoices.remind('INV-ID', { subject: 'Payment reminder' });
await paypal.invoices.recordPayment('INV-ID', {
  method: 'BANK_TRANSFER',
  amount: { currency_code: 'USD', value: '500.00' },
});

const qr = await paypal.invoices.generateQrCode('INV-ID', { width: 300, height: 300 });
const list = await paypal.invoices.list({ page_size: 20 });
```

`invoices.update` performs a full replace (HTTP `PUT`). Other helpers: `delete`, `cancel`, `recordRefund`.

## Webhooks

Register a webhook once per environment, then verify each incoming delivery against PayPal's `verify-webhook-signature` API.

```ts
const webhook = await paypal.webhooks.create({
  url: 'https://shop.example/paypal/webhook',
  event_types: [
    { name: 'CHECKOUT.ORDER.APPROVED' },
    { name: 'PAYMENT.CAPTURE.COMPLETED' },
    { name: 'PAYMENT.CAPTURE.REFUNDED' },
  ],
});

console.log(webhook.id); // store as PAYPAL_WEBHOOK_ID
```

Verify and parse the event in an Express handler using the raw request body:

```ts
import express from 'express';
import { createPayPalClient, parseWebhookEvent } from '@biggora/paypal';

const paypal = createPayPalClient({
  clientId: process.env.PAYPAL_CLIENT_ID!,
  clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
  webhookId: process.env.PAYPAL_WEBHOOK_ID!,
});

const app = express();

app.post('/paypal/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const event = parseWebhookEvent(req.body as Buffer);

  const { verification_status } = await paypal.verifyWebhook({
    headers: req.headers,
    event,
  });

  if (verification_status !== 'SUCCESS') {
    return res.status(400).send('Invalid signature');
  }

  if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    // fulfill the order from event.resource
  }

  return res.sendStatus(200);
});
```

`verifyWebhook` reads `webhookId` from the parameter or from `PayPalClientOptions.webhookId`. The lower-level helpers `extractTransmissionHeaders(headers)` and `buildVerifyWebhookPayload({ headers, webhookId, event })` are exported for custom flows, and `paypal.webhooks.verifySignature(payload)` calls the API directly.

## NestJS

Use the `@biggora/paypal/nestjs` subpath export.

```ts
import { Module } from '@nestjs/common';
import { PayPalModule } from '@biggora/paypal/nestjs';

@Module({
  imports: [
    PayPalModule.forRoot({
      clientId: process.env.PAYPAL_CLIENT_ID!,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET!,
      environment: 'sandbox',
      webhookId: process.env.PAYPAL_WEBHOOK_ID,
    }),
  ],
})
export class PaymentsModule {}
```

Async config keeps credentials in your existing config service:

```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PayPalModule } from '@biggora/paypal/nestjs';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PayPalModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        clientId: config.getOrThrow<string>('PAYPAL_CLIENT_ID'),
        clientSecret: config.getOrThrow<string>('PAYPAL_CLIENT_SECRET'),
        environment: config.get<'sandbox' | 'live'>('PAYPAL_ENV') ?? 'sandbox',
        webhookId: config.get<string>('PAYPAL_WEBHOOK_ID'),
      }),
    }),
  ],
})
export class PaymentsModule {}
```

Inject the client into services:

```ts
import { Injectable } from '@nestjs/common';
import { InjectPayPalClient } from '@biggora/paypal/nestjs';
import type { PayPalClient } from '@biggora/paypal';

@Injectable()
export class CheckoutService {
  constructor(@InjectPayPalClient() private readonly paypal: PayPalClient) {}

  capture(orderId: string) {
    return this.paypal.orders.capture(orderId);
  }
}
```

You can also inject by token with `@Inject(PAYPAL_CLIENT)`.

Verify webhooks with the provided `PayPalWebhookVerifier`. Enable raw body so signatures can be validated:

```ts
const app = await NestFactory.create(AppModule, { rawBody: true });
```

```ts
import { Controller, Post, Req } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PayPalWebhookVerifier } from '@biggora/paypal/nestjs';

@Controller('paypal')
export class PayPalWebhookController {
  constructor(private readonly verifier: PayPalWebhookVerifier) {}

  @Post('webhook')
  async webhook(@Req() req: RawBodyRequest<Request>) {
    const rawBody = req.rawBody ?? Buffer.alloc(0);
    const event = this.verifier.parse(rawBody);

    const verified = await this.verifier.isVerified({
      headers: req.headers,
      event,
    });

    if (!verified) {
      return { ok: false };
    }

    // handle event.event_type
    return { ok: true };
  }
}
```

`PayPalWebhookVerifier` exposes `parse(rawBody)`, `verify({ headers, event, webhookId? })`, and `isVerified({ headers, event, webhookId? }): Promise<boolean>`.

## Error Handling

Every failed request throws `PayPalApiError`.

```ts
import { PayPalApiError } from '@biggora/paypal';

try {
  await paypal.orders.capture('missing-order-id');
} catch (error) {
  if (error instanceof PayPalApiError) {
    console.error(error.status);   // HTTP status code
    console.error(error.code);     // PayPal error name, e.g. RESOURCE_NOT_FOUND
    console.error(error.message);  // human-readable message
    console.error(error.debugId);  // PayPal debug ID for support
    console.error(error.details);  // structured error details
    console.error(error.links);    // HATEOAS links
  }
}
```

## Type Safety

All request bodies, query parameters, and responses are derived from PayPal's official OpenAPI specifications (the [`paypal/paypal-rest-api-specifications`](https://github.com/paypal/paypal-rest-api-specifications) repository). Regenerate the typings with:

```bash
npm run generate:types
```

Per-domain schema namespaces are re-exported for building your own typed payloads:

```ts
import type { OrdersSchema, PaymentsSchema, SubscriptionsSchema } from '@biggora/paypal';

type OrderRequest = OrdersSchema.components['schemas']['order_request'];
```

Available namespaces: `OrdersSchema`, `PaymentsSchema`, `SubscriptionsSchema`, `ProductsSchema`, `InvoicingSchema`, `PayoutsSchema`, `WebhooksSchema`.

## Scripts

```bash
npm run build           # bundle ESM + CJS with tsup
npm test                # run the vitest suite
npm run typecheck       # tsc --noEmit
npm run generate:types  # regenerate OpenAPI typings from PayPal specs
```

## License

[MIT](https://opensource.org/licenses/MIT)
