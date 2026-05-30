import { Injectable } from '@nestjs/common';

import { PayPalClient } from '../client.js';
import type { PayPalWebhookEvent } from '../core/webhook.js';
import { parseWebhookEvent } from '../core/webhook.js';
import { InjectPayPalClient } from './tokens.js';

@Injectable()
export class PayPalWebhookVerifier {
  constructor(@InjectPayPalClient() private readonly client: PayPalClient) {}

  parse<TResource = unknown>(rawBody: Buffer | string): PayPalWebhookEvent<TResource> {
    return parseWebhookEvent<TResource>(rawBody);
  }

  verify(params: {
    headers: Record<string, string | string[] | undefined> | Headers;
    event: unknown;
    webhookId?: string;
  }): ReturnType<PayPalClient['verifyWebhook']> {
    return this.client.verifyWebhook(params);
  }

  async isVerified(params: {
    headers: Record<string, string | string[] | undefined> | Headers;
    event: unknown;
    webhookId?: string;
  }): Promise<boolean> {
    const result = await this.client.verifyWebhook(params);
    return result.verification_status === 'SUCCESS';
  }
}
