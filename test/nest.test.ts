import 'reflect-metadata';

import { Controller, Inject, Post, Req } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { RawBodyRequest } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ExpressAdapter } from '@nestjs/platform-express';
import type { Request } from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';

import type { FetchLike, PayPalClient } from '../src/index.js';
import {
  InjectPayPalClient,
  PAYPAL_CLIENT,
  PayPalModule,
  PayPalWebhookVerifier,
} from '../src/nest/index.js';

function makeFetchMock(verifyStatus = 'SUCCESS'): FetchLike {
  return async (input) => {
    const url = String(input);
    if (url.includes('/v1/oauth2/token')) {
      return new Response(
        JSON.stringify({ access_token: 'token-1', token_type: 'Bearer', expires_in: 3600 }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    if (url.includes('/v1/notifications/verify-webhook-signature')) {
      return new Response(
        JSON.stringify({ verification_status: verifyStatus }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    }
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  };
}

class DirectInjectService {
  constructor(@Inject(PAYPAL_CLIENT) readonly client: PayPalClient) {}
}

class DecoratorInjectService {
  constructor(@InjectPayPalClient() readonly client: PayPalClient) {}
}

@Controller('webhooks')
class WebhookController {
  constructor(
    @Inject(PayPalWebhookVerifier) private readonly verifier: PayPalWebhookVerifier,
  ) {}

  @Post()
  handle(@Req() req: RawBodyRequest<Request>) {
    const payload = req.rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    return this.verifier.parse(payload);
  }
}

describe('PayPal NestJS integration', () => {
  it('registers PAYPAL_CLIENT through PayPalModule.forRoot', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PayPalModule.forRoot({
          clientId: 'client-id',
          clientSecret: 'client-secret',
          baseUrl: 'https://paypal.test/',
          fetch: makeFetchMock(),
        }),
      ],
      providers: [DirectInjectService, DecoratorInjectService],
    }).compile();

    const direct = moduleRef.get(DirectInjectService);
    const decorated = moduleRef.get(DecoratorInjectService);

    expect(direct.client).toBeDefined();
    expect(decorated.client).toBeDefined();
    expect(decorated.client).toBe(direct.client);
  });

  it('exposes resource namespaces on the registered client', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PayPalModule.forRoot({
          clientId: 'client-id',
          clientSecret: 'client-secret',
          baseUrl: 'https://paypal.test/',
          fetch: makeFetchMock(),
        }),
      ],
    }).compile();

    const client = moduleRef.get<PayPalClient>(PAYPAL_CLIENT);
    expect(client.orders).toBeDefined();
    expect(client.payments).toBeDefined();
    expect(client.webhooks).toBeDefined();
    expect(client.subscriptions).toBeDefined();
    expect(client.plans).toBeDefined();
    expect(client.payouts).toBeDefined();
    expect(client.products).toBeDefined();
    expect(client.invoices).toBeDefined();
  });

  it('registers PAYPAL_CLIENT through PayPalModule.forRootAsync with useFactory', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PayPalModule.forRootAsync({
          useFactory: async () => ({
            clientId: 'client-id',
            clientSecret: 'client-secret',
            baseUrl: 'https://paypal.test/',
            fetch: makeFetchMock(),
          }),
        }),
      ],
    }).compile();

    const client = moduleRef.get<PayPalClient>(PAYPAL_CLIENT);
    expect(client).toBeDefined();
    expect(client.orders).toBeDefined();
  });

  it('injects the same client instance via @Inject(PAYPAL_CLIENT) and @InjectPayPalClient()', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PayPalModule.forRoot({
          clientId: 'client-id',
          clientSecret: 'client-secret',
          baseUrl: 'https://paypal.test/',
          fetch: makeFetchMock(),
        }),
      ],
      providers: [DirectInjectService, DecoratorInjectService],
    }).compile();

    const direct = moduleRef.get(DirectInjectService);
    const decorated = moduleRef.get(DecoratorInjectService);
    expect(direct.client).toBe(decorated.client);
  });

  it('resolves PayPalWebhookVerifier from the module container', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PayPalModule.forRoot({
          clientId: 'client-id',
          clientSecret: 'client-secret',
          webhookId: 'wh-id-1',
          baseUrl: 'https://paypal.test/',
          fetch: makeFetchMock(),
        }),
      ],
    }).compile();

    const verifier = moduleRef.get(PayPalWebhookVerifier);
    expect(verifier).toBeDefined();
    expect(typeof verifier.parse).toBe('function');
    expect(typeof verifier.verify).toBe('function');
    expect(typeof verifier.isVerified).toBe('function');
  });

  it('PayPalWebhookVerifier.verify delegates to client.verifyWebhook and returns verification_status', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PayPalModule.forRoot({
          clientId: 'client-id',
          clientSecret: 'client-secret',
          webhookId: 'wh-id-1',
          baseUrl: 'https://paypal.test/',
          fetch: makeFetchMock('SUCCESS'),
        }),
      ],
    }).compile();

    const verifier = moduleRef.get(PayPalWebhookVerifier);
    const result = await verifier.verify({
      headers: {
        'paypal-transmission-id': 'tid-1',
        'paypal-transmission-time': '2024-01-01T00:00:00Z',
        'paypal-transmission-sig': 'sig-1',
        'paypal-cert-url': 'https://api.paypal.com/v1/notifications/certs/CERT-1',
        'paypal-auth-algo': 'SHA256withRSA',
      },
      event: { id: 'evt-1', event_type: 'PAYMENT.CAPTURE.COMPLETED' },
    });

    expect(result.verification_status).toBe('SUCCESS');
  });

  it('PayPalWebhookVerifier.isVerified returns true when verification_status is SUCCESS', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PayPalModule.forRoot({
          clientId: 'client-id',
          clientSecret: 'client-secret',
          webhookId: 'wh-id-1',
          baseUrl: 'https://paypal.test/',
          fetch: makeFetchMock('SUCCESS'),
        }),
      ],
    }).compile();

    const verifier = moduleRef.get(PayPalWebhookVerifier);
    const verified = await verifier.isVerified({
      headers: {
        'paypal-transmission-id': 'tid-1',
        'paypal-transmission-time': '2024-01-01T00:00:00Z',
        'paypal-transmission-sig': 'sig-1',
        'paypal-cert-url': 'https://api.paypal.com/v1/notifications/certs/CERT-1',
        'paypal-auth-algo': 'SHA256withRSA',
      },
      event: { id: 'evt-1', event_type: 'PAYMENT.CAPTURE.COMPLETED' },
    });

    expect(verified).toBe(true);
  });

  it('PayPalWebhookVerifier.isVerified returns false when verification_status is not SUCCESS', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PayPalModule.forRoot({
          clientId: 'client-id',
          clientSecret: 'client-secret',
          webhookId: 'wh-id-1',
          baseUrl: 'https://paypal.test/',
          fetch: makeFetchMock('FAILURE'),
        }),
      ],
    }).compile();

    const verifier = moduleRef.get(PayPalWebhookVerifier);
    const verified = await verifier.isVerified({
      headers: {
        'paypal-transmission-id': 'tid-1',
        'paypal-transmission-time': '2024-01-01T00:00:00Z',
        'paypal-transmission-sig': 'sig-1',
        'paypal-cert-url': 'https://api.paypal.com/v1/notifications/certs/CERT-1',
        'paypal-auth-algo': 'SHA256withRSA',
      },
      event: { id: 'evt-1', event_type: 'PAYMENT.CAPTURE.COMPLETED' },
    });

    expect(verified).toBe(false);
  });

  it('parses webhook payload in a Nest controller via rawBody', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        PayPalModule.forRoot({
          clientId: 'client-id',
          clientSecret: 'client-secret',
          baseUrl: 'https://paypal.test/',
          fetch: makeFetchMock(),
        }),
      ],
      controllers: [WebhookController],
    }).compile();

    const app = moduleRef.createNestApplication<NestExpressApplication>(
      new ExpressAdapter(),
      { rawBody: true },
    );
    await app.init();

    await request(app.getHttpServer())
      .post('/webhooks')
      .set('content-type', 'application/json')
      .send(JSON.stringify({ id: 'evt-1', event_type: 'PAYMENT.CAPTURE.COMPLETED' }))
      .expect(201)
      .expect((response) => {
        expect(response.body).toEqual({
          id: 'evt-1',
          event_type: 'PAYMENT.CAPTURE.COMPLETED',
        });
      });

    await app.close();
  });
});
