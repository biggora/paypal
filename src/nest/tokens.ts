import { Inject } from '@nestjs/common';

export const PAYPAL_CLIENT = Symbol('PAYPAL_CLIENT');
export const PAYPAL_MODULE_OPTIONS = Symbol('PAYPAL_MODULE_OPTIONS');

export function InjectPayPalClient(): ParameterDecorator {
  return Inject(PAYPAL_CLIENT);
}
