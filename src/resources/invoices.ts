import type { HttpClient } from '../core/http-client.js';
import type { OperationQueryOf, OperationRequestBodyOf, OperationResponseOf } from '../core/openapi.js';
import type { operations } from '../generated/invoicing.js';

export class InvoicesResource {
  constructor(private readonly httpClient: HttpClient) {}

  create(
    body: OperationRequestBodyOf<operations['invoices.create']>,
  ): Promise<OperationResponseOf<operations['invoices.create']>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/v2/invoicing/invoices',
      body,
    });
  }

  list(
    query?: OperationQueryOf<operations['invoices.list']>,
  ): Promise<OperationResponseOf<operations['invoices.list']>> {
    return this.httpClient.request({
      method: 'GET',
      path: '/v2/invoicing/invoices',
      query,
    });
  }

  get(id: string): Promise<OperationResponseOf<operations['invoices.get']>> {
    return this.httpClient.request({
      method: 'GET',
      path: `/v2/invoicing/invoices/${encodeURIComponent(id)}`,
    });
  }

  /** Fully updates an invoice (PUT). */
  update(
    id: string,
    body: OperationRequestBodyOf<operations['invoices.update']>,
    query?: OperationQueryOf<operations['invoices.update']>,
  ): Promise<OperationResponseOf<operations['invoices.update']>> {
    return this.httpClient.request({
      method: 'PUT',
      path: `/v2/invoicing/invoices/${encodeURIComponent(id)}`,
      body,
      query,
    });
  }

  delete(id: string): Promise<OperationResponseOf<operations['invoices.delete']>> {
    return this.httpClient.request({
      method: 'DELETE',
      path: `/v2/invoicing/invoices/${encodeURIComponent(id)}`,
    });
  }

  send(
    id: string,
    body?: OperationRequestBodyOf<operations['invoices.send']>,
  ): Promise<OperationResponseOf<operations['invoices.send']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v2/invoicing/invoices/${encodeURIComponent(id)}/send`,
      body,
    });
  }

  remind(
    id: string,
    body?: OperationRequestBodyOf<operations['invoices.remind']>,
  ): Promise<OperationResponseOf<operations['invoices.remind']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v2/invoicing/invoices/${encodeURIComponent(id)}/remind`,
      body,
    });
  }

  cancel(
    id: string,
    body?: OperationRequestBodyOf<operations['invoices.cancel']>,
  ): Promise<OperationResponseOf<operations['invoices.cancel']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v2/invoicing/invoices/${encodeURIComponent(id)}/cancel`,
      body,
    });
  }

  generateQrCode(
    id: string,
    body?: OperationRequestBodyOf<operations['invoices.generate-qr-code']>,
  ): Promise<OperationResponseOf<operations['invoices.generate-qr-code']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v2/invoicing/invoices/${encodeURIComponent(id)}/generate-qr-code`,
      body,
    });
  }

  generateInvoiceNumber(): Promise<OperationResponseOf<operations['invoicing.generate-next-invoice-number']>> {
    return this.httpClient.request({
      method: 'POST',
      path: '/v2/invoicing/generate-next-invoice-number',
    });
  }

  recordPayment(
    id: string,
    body: OperationRequestBodyOf<operations['invoices.payments']>,
  ): Promise<OperationResponseOf<operations['invoices.payments']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v2/invoicing/invoices/${encodeURIComponent(id)}/payments`,
      body,
    });
  }

  recordRefund(
    id: string,
    body: OperationRequestBodyOf<operations['invoices.refunds']>,
  ): Promise<OperationResponseOf<operations['invoices.refunds']>> {
    return this.httpClient.request({
      method: 'POST',
      path: `/v2/invoicing/invoices/${encodeURIComponent(id)}/refunds`,
      body,
    });
  }
}
