import type { DynamicModule, FactoryProvider, ModuleMetadata, Provider } from '@nestjs/common';
import { Module } from '@nestjs/common';

import { PayPalClient } from '../client.js';
import type { PayPalClientOptions } from '../core/http-client.js';
import { PAYPAL_CLIENT, PAYPAL_MODULE_OPTIONS } from './tokens.js';
import { PayPalWebhookVerifier } from './webhook-verifier.js';

export type PayPalModuleAsyncOptions = {
  imports?: ModuleMetadata['imports'];
  inject?: FactoryProvider<PayPalClientOptions>['inject'];
  useFactory: (...args: any[]) => Promise<PayPalClientOptions> | PayPalClientOptions;
};

function createClientProvider(): Provider {
  return {
    provide: PAYPAL_CLIENT,
    inject: [PAYPAL_MODULE_OPTIONS],
    useFactory: (options: PayPalClientOptions) => new PayPalClient(options),
  };
}

@Module({})
export class PayPalModule {
  static forRoot(options: PayPalClientOptions): DynamicModule {
    return {
      module: PayPalModule,
      providers: [
        {
          provide: PAYPAL_MODULE_OPTIONS,
          useValue: options,
        },
        createClientProvider(),
        PayPalWebhookVerifier,
      ],
      exports: [PAYPAL_CLIENT, PayPalWebhookVerifier],
    };
  }

  static forRootAsync(options: PayPalModuleAsyncOptions): DynamicModule {
    return {
      module: PayPalModule,
      imports: options.imports ?? [],
      providers: [
        {
          provide: PAYPAL_MODULE_OPTIONS,
          inject: options.inject ?? [],
          useFactory: options.useFactory,
        },
        createClientProvider(),
        PayPalWebhookVerifier,
      ],
      exports: [PAYPAL_CLIENT, PayPalWebhookVerifier],
    };
  }
}
