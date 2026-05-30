import type { HttpClient } from '../core/http-client.js';
import type { OperationQueryOf, OperationRequestBodyOf, OperationResponseOf } from '../core/openapi.js';
import type { operations } from '../generated/products.js';

export class ProductsResource {
  constructor(private readonly httpClient: HttpClient) {}

  create(
    body: OperationRequestBodyOf<operations['products.create']>,
    headers?: Record<string, string>,
  ): Promise<OperationResponseOf<operations['products.create']>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/v1/catalogs/products',
      body,
      headers,
    });
  }

  list(
    query?: OperationQueryOf<operations['products.list']>,
  ): Promise<OperationResponseOf<operations['products.list']>> {
    return this.httpClient.request({
      method: 'GET',
      path: '/v1/catalogs/products',
      query,
    });
  }

  get(id: string): Promise<OperationResponseOf<operations['products.get']>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/v1/catalogs/products/${encodeURIComponent(id)}`,
    });
  }

  update(
    id: string,
    body: OperationRequestBodyOf<operations['products.patch']>,
  ): Promise<OperationResponseOf<operations['products.patch']>> {
    return this.httpClient.request({
      method: 'PATCH',
      path: `/v1/catalogs/products/${encodeURIComponent(id)}`,
      body,
    });
  }
}
