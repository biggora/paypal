/**
 * Generic OpenAPI type helpers for PayPal SDK.
 *
 * These helpers are parameterized over an operation type (Op), so they work
 * across all generated files (orders, payments, subscriptions, etc.).
 *
 * Usage example:
 *   import type { operations } from '../generated/orders.js';
 *   type CreateOrderBody = OperationRequestBodyOf<operations['orders.create']>;
 *   type CreateOrderResponse = OperationResponseOf<operations['orders.create']>;
 *   type CreateOrderQuery = OperationQueryOf<operations['orders.create']>;
 */

/** Extracts `T['content']['application/json']` when that path exists. */
export type JsonContentOf<T> =
  T extends { content: { 'application/json': infer Value } } ? Value : never;

/**
 * Extracts the JSON body of an operation's requestBody.
 * Handles both required (`requestBody: {...}`) and optional (`requestBody?: {...}`) forms.
 */
export type OperationRequestBodyOf<Op> =
  Op extends { requestBody: infer RequestBody }
    ? JsonContentOf<RequestBody>
    : Op extends { requestBody?: infer RequestBody }
      ? JsonContentOf<Exclude<RequestBody, undefined>>
      : never;

/**
 * Extracts the successful JSON response of an operation.
 * Checks 200, 201, 202 in order; resolves to `undefined` for 204 (no content).
 */
export type OperationResponseOf<Op> =
  Op extends { responses: infer Responses }
    ? Responses extends { 200: infer R200 }
      ? JsonContentOf<R200>
      : Responses extends { 201: infer R201 }
        ? JsonContentOf<R201>
        : Responses extends { 202: infer R202 }
          ? JsonContentOf<R202>
          : Responses extends { 204: unknown }
            ? undefined
            : undefined
    : undefined;

/** Extracts query parameters of an operation. */
export type OperationQueryOf<Op> =
  Op extends { parameters: { query?: infer Query } }
    ? Exclude<Query, undefined>
    : never;

/** Extracts path parameters of an operation. */
export type OperationPathOf<Op> =
  Op extends { parameters: { path?: infer Path } }
    ? Exclude<Path, undefined>
    : never;
