import { describe, expect, it, vi } from 'vitest';

import { createPayPalClient } from '../src/index.js';
import type { FetchRequestInput } from '../src/index.js';

type CallRecord = { method: string; pathname: string };

function makeClient() {
  const calls: CallRecord[] = [];

  const fetchMock = vi.fn(async (input: FetchRequestInput, init?: RequestInit) => {
    const url = String(input);
    if (url.includes('/v1/oauth2/token')) {
      return new Response(
        JSON.stringify({ access_token: 'tok', token_type: 'Bearer', expires_in: 3600 }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }

    calls.push({
      method: init?.method ?? 'GET',
      pathname: new URL(url).pathname,
    });

    return new Response(JSON.stringify({ id: 'resource-1' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });

  const client = createPayPalClient({
    clientId: 'id',
    clientSecret: 'secret',
    baseUrl: 'https://paypal.test/',
    fetch: fetchMock,
  });

  return { client, calls };
}

describe('PayPal resource routing', () => {
  it('routes Orders resource methods to correct HTTP method and path', async () => {
    const { client, calls } = makeClient();

    await client.orders.create({ intent: 'CAPTURE', purchase_units: [] } as never);
    await client.orders.get('ord-1');
    await client.orders.update('ord-1', [] as never);
    await client.orders.capture('ord-1');
    await client.orders.authorize('ord-1');
    await client.orders.confirmPaymentSource('ord-1', {} as never);
    await client.orders.track('ord-1', {} as never);
    await client.orders.updateTracking('ord-1', 'tracker-1', [] as never);

    expect(calls.map(({ method, pathname }) => `${method} ${pathname}`)).toEqual([
      'POST /v2/checkout/orders',
      'GET /v2/checkout/orders/ord-1',
      'PATCH /v2/checkout/orders/ord-1',
      'POST /v2/checkout/orders/ord-1/capture',
      'POST /v2/checkout/orders/ord-1/authorize',
      'POST /v2/checkout/orders/ord-1/confirm-payment-source',
      'POST /v2/checkout/orders/ord-1/track',
      'PATCH /v2/checkout/orders/ord-1/trackers/tracker-1',
    ]);
  });

  it('routes Payments resource methods to correct HTTP method and path', async () => {
    const { client, calls } = makeClient();

    await client.payments.getAuthorization('auth-1');
    await client.payments.captureAuthorization('auth-1');
    await client.payments.reauthorizeAuthorization('auth-1');
    await client.payments.voidAuthorization('auth-1');
    await client.payments.getCapture('cap-1');
    await client.payments.refundCapture('cap-1');
    await client.payments.getRefund('ref-1');

    expect(calls.map(({ method, pathname }) => `${method} ${pathname}`)).toEqual([
      'GET /v2/payments/authorizations/auth-1',
      'POST /v2/payments/authorizations/auth-1/capture',
      'POST /v2/payments/authorizations/auth-1/reauthorize',
      'POST /v2/payments/authorizations/auth-1/void',
      'GET /v2/payments/captures/cap-1',
      'POST /v2/payments/captures/cap-1/refund',
      'GET /v2/payments/refunds/ref-1',
    ]);
  });

  it('routes Webhooks resource methods to correct HTTP method and path', async () => {
    const { client, calls } = makeClient();

    await client.webhooks.create({ url: 'https://test.example/hook', event_types: [] } as never);
    await client.webhooks.list();
    await client.webhooks.get('wh-1');
    await client.webhooks.update('wh-1', [] as never);
    await client.webhooks.delete('wh-1');
    await client.webhooks.listEventTypes('wh-1');
    await client.webhooks.listAvailableEventTypes();
    await client.webhooks.verifySignature({
      transmission_id: 'tid',
      transmission_time: 'time',
      cert_url: 'https://cert.url',
      auth_algo: 'SHA256withRSA',
      transmission_sig: 'sig',
      webhook_id: 'wh-1',
      webhook_event: {},
    } as never);

    expect(calls.map(({ method, pathname }) => `${method} ${pathname}`)).toEqual([
      'POST /v1/notifications/webhooks',
      'GET /v1/notifications/webhooks',
      'GET /v1/notifications/webhooks/wh-1',
      'PATCH /v1/notifications/webhooks/wh-1',
      'DELETE /v1/notifications/webhooks/wh-1',
      'GET /v1/notifications/webhooks/wh-1/event-types',
      'GET /v1/notifications/webhooks-event-types',
      'POST /v1/notifications/verify-webhook-signature',
    ]);
  });

  it('routes Subscriptions resource methods to correct HTTP method and path', async () => {
    const { client, calls } = makeClient();

    await client.subscriptions.create({ plan_id: 'plan-1' } as never);
    await client.subscriptions.get('sub-1');
    await client.subscriptions.update('sub-1', [] as never);
    await client.subscriptions.revise('sub-1', {} as never);
    await client.subscriptions.activate('sub-1');
    await client.subscriptions.suspend('sub-1');
    await client.subscriptions.cancel('sub-1');
    await client.subscriptions.capture('sub-1', {} as never);
    await client.subscriptions.listTransactions('sub-1', {
      start_time: '2024-01-01T00:00:00Z',
      end_time: '2024-12-31T00:00:00Z',
    } as never);

    expect(calls.map(({ method, pathname }) => `${method} ${pathname}`)).toEqual([
      'POST /v1/billing/subscriptions',
      'GET /v1/billing/subscriptions/sub-1',
      'PATCH /v1/billing/subscriptions/sub-1',
      'POST /v1/billing/subscriptions/sub-1/revise',
      'POST /v1/billing/subscriptions/sub-1/activate',
      'POST /v1/billing/subscriptions/sub-1/suspend',
      'POST /v1/billing/subscriptions/sub-1/cancel',
      'POST /v1/billing/subscriptions/sub-1/capture',
      'GET /v1/billing/subscriptions/sub-1/transactions',
    ]);
  });

  it('routes Plans resource methods to correct HTTP method and path', async () => {
    const { client, calls } = makeClient();

    await client.plans.create({ product_id: 'prod-1', billing_cycles: [] } as never);
    await client.plans.list();
    await client.plans.get('plan-1');
    await client.plans.update('plan-1', [] as never);
    await client.plans.activate('plan-1');
    await client.plans.deactivate('plan-1');
    await client.plans.updatePricingSchemes('plan-1', { pricing_schemes: [] } as never);

    expect(calls.map(({ method, pathname }) => `${method} ${pathname}`)).toEqual([
      'POST /v1/billing/plans',
      'GET /v1/billing/plans',
      'GET /v1/billing/plans/plan-1',
      'PATCH /v1/billing/plans/plan-1',
      'POST /v1/billing/plans/plan-1/activate',
      'POST /v1/billing/plans/plan-1/deactivate',
      'POST /v1/billing/plans/plan-1/update-pricing-schemes',
    ]);
  });

  it('routes Payouts resource methods to correct HTTP method and path', async () => {
    const { client, calls } = makeClient();

    await client.payouts.create({ sender_batch_header: {}, items: [] } as never);
    await client.payouts.get('batch-1');
    await client.payouts.getItem('item-1');
    await client.payouts.cancelItem('item-1');

    expect(calls.map(({ method, pathname }) => `${method} ${pathname}`)).toEqual([
      'POST /v1/payments/payouts',
      'GET /v1/payments/payouts/batch-1',
      'GET /v1/payments/payouts-item/item-1',
      'POST /v1/payments/payouts-item/item-1/cancel',
    ]);
  });

  it('routes Products resource methods to correct HTTP method and path', async () => {
    const { client, calls } = makeClient();

    await client.products.create({ name: 'My Product' } as never);
    await client.products.list();
    await client.products.get('prod-1');
    await client.products.update('prod-1', [] as never);

    expect(calls.map(({ method, pathname }) => `${method} ${pathname}`)).toEqual([
      'POST /v1/catalogs/products',
      'GET /v1/catalogs/products',
      'GET /v1/catalogs/products/prod-1',
      'PATCH /v1/catalogs/products/prod-1',
    ]);
  });

  it('routes Invoices resource methods to correct HTTP method and path', async () => {
    const { client, calls } = makeClient();

    await client.invoices.create({ detail: {} } as never);
    await client.invoices.list();
    await client.invoices.get('inv-1');
    await client.invoices.update('inv-1', {} as never);
    await client.invoices.delete('inv-1');
    await client.invoices.send('inv-1');
    await client.invoices.remind('inv-1');
    await client.invoices.cancel('inv-1');
    await client.invoices.generateInvoiceNumber();
    await client.invoices.recordPayment('inv-1', {} as never);
    await client.invoices.recordRefund('inv-1', {} as never);

    expect(calls.map(({ method, pathname }) => `${method} ${pathname}`)).toEqual([
      'POST /v2/invoicing/invoices',
      'GET /v2/invoicing/invoices',
      'GET /v2/invoicing/invoices/inv-1',
      'PUT /v2/invoicing/invoices/inv-1',
      'DELETE /v2/invoicing/invoices/inv-1',
      'POST /v2/invoicing/invoices/inv-1/send',
      'POST /v2/invoicing/invoices/inv-1/remind',
      'POST /v2/invoicing/invoices/inv-1/cancel',
      'POST /v2/invoicing/generate-next-invoice-number',
      'POST /v2/invoicing/invoices/inv-1/payments',
      'POST /v2/invoicing/invoices/inv-1/refunds',
    ]);
  });

  it('URL-encodes path segment with special characters', async () => {
    const { client, calls } = makeClient();

    await client.orders.get('order 1/special');

    expect(calls[0]?.pathname).toBe('/v2/checkout/orders/order%201%2Fspecial');
  });
});
