import { describe, expect, it } from 'vitest';

import * as MainExports from '../src/index.js';
import * as NestExports from '../src/nest/index.js';

describe('Main package exports', () => {
  it('exports createPayPalClient factory function', () => {
    expect(typeof MainExports.createPayPalClient).toBe('function');
  });

  it('exports PayPalClient class', () => {
    expect(typeof MainExports.PayPalClient).toBe('function');
  });

  it('exports PayPalApiError class', () => {
    expect(typeof MainExports.PayPalApiError).toBe('function');
  });

  it('exports parseWebhookEvent function', () => {
    expect(typeof MainExports.parseWebhookEvent).toBe('function');
  });

  it('exports extractTransmissionHeaders function', () => {
    expect(typeof MainExports.extractTransmissionHeaders).toBe('function');
  });

  it('exports buildVerifyWebhookPayload function', () => {
    expect(typeof MainExports.buildVerifyWebhookPayload).toBe('function');
  });

  it('exports InvoicesResource class', () => {
    expect(typeof MainExports.InvoicesResource).toBe('function');
  });

  it('exports OrdersResource class', () => {
    expect(typeof MainExports.OrdersResource).toBe('function');
  });

  it('exports PaymentsResource class', () => {
    expect(typeof MainExports.PaymentsResource).toBe('function');
  });

  it('exports PayoutsResource class', () => {
    expect(typeof MainExports.PayoutsResource).toBe('function');
  });

  it('exports PlansResource class', () => {
    expect(typeof MainExports.PlansResource).toBe('function');
  });

  it('exports ProductsResource class', () => {
    expect(typeof MainExports.ProductsResource).toBe('function');
  });

  it('exports SubscriptionsResource class', () => {
    expect(typeof MainExports.SubscriptionsResource).toBe('function');
  });

  it('exports WebhooksResource class', () => {
    expect(typeof MainExports.WebhooksResource).toBe('function');
  });

  it('PayPalApiError instances are identifiable by name', () => {
    const err = new MainExports.PayPalApiError('test error', { code: 'test_code', status: 400 });
    expect(err.name).toBe('PayPalApiError');
    expect(err.code).toBe('test_code');
    expect(err.status).toBe(400);
    expect(err instanceof MainExports.PayPalApiError).toBe(true);
    expect(err instanceof Error).toBe(true);
  });

  it('createPayPalClient returns a PayPalClient instance with all resource namespaces', () => {
    const client = MainExports.createPayPalClient({
      clientId: 'id',
      clientSecret: 'secret',
      fetch: async () => new Response(),
    });
    expect(client).toBeInstanceOf(MainExports.PayPalClient);
    expect(client.orders).toBeInstanceOf(MainExports.OrdersResource);
    expect(client.payments).toBeInstanceOf(MainExports.PaymentsResource);
    expect(client.webhooks).toBeInstanceOf(MainExports.WebhooksResource);
    expect(client.subscriptions).toBeInstanceOf(MainExports.SubscriptionsResource);
    expect(client.plans).toBeInstanceOf(MainExports.PlansResource);
    expect(client.payouts).toBeInstanceOf(MainExports.PayoutsResource);
    expect(client.products).toBeInstanceOf(MainExports.ProductsResource);
    expect(client.invoices).toBeInstanceOf(MainExports.InvoicesResource);
  });
});

describe('NestJS package exports', () => {
  it('exports PayPalModule', () => {
    expect(typeof NestExports.PayPalModule).toBe('function');
  });

  it('exports PAYPAL_CLIENT token', () => {
    expect(NestExports.PAYPAL_CLIENT).toBeDefined();
    expect(typeof NestExports.PAYPAL_CLIENT).toBe('symbol');
  });

  it('exports PAYPAL_MODULE_OPTIONS token', () => {
    expect(NestExports.PAYPAL_MODULE_OPTIONS).toBeDefined();
    expect(typeof NestExports.PAYPAL_MODULE_OPTIONS).toBe('symbol');
  });

  it('exports InjectPayPalClient decorator factory', () => {
    expect(typeof NestExports.InjectPayPalClient).toBe('function');
  });

  it('exports PayPalWebhookVerifier class', () => {
    expect(typeof NestExports.PayPalWebhookVerifier).toBe('function');
  });

  it('PayPalModule has static forRoot method', () => {
    expect(typeof NestExports.PayPalModule.forRoot).toBe('function');
  });

  it('PayPalModule has static forRootAsync method', () => {
    expect(typeof NestExports.PayPalModule.forRootAsync).toBe('function');
  });

  it('PAYPAL_CLIENT and PAYPAL_MODULE_OPTIONS are distinct tokens', () => {
    expect(NestExports.PAYPAL_CLIENT).not.toBe(NestExports.PAYPAL_MODULE_OPTIONS);
  });
});
