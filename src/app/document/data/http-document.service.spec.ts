import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HttpDocumentService } from './http-document.service';

/**
 * The adapter against the contract `07-api/contracts/openapi/document-service.yaml`,
 * through the public route of the gateway. The HttpClient comes from the shell
 * (token, correlation id, timeout and error normalisation); here it is the testing one.
 */
describe('HttpDocumentService', () => {
  let service: HttpDocumentService;
  let http: HttpTestingController;

  const available = {
    id: '6f178b1a-9c0d-4c23-96ad-1e8da3b2ef6d',
    summaryId: '5a1b2c3d-5555-4555-8555-555555555555',
    patientId: 'c1b2c3d4-3333-4333-8333-333333333333',
    format: 'PDF',
    status: 'AVAILABLE',
    retryCount: 0,
    createdAt: '2026-10-20T15:00:00Z',
    generatedAt: '2026-10-20T15:00:05Z',
  };
  const pending = {
    id: '7a178b1a-9c0d-4c23-96ad-1e8da3b2ef6d',
    summaryId: '6a1b2c3d-5555-4555-8555-555555555555',
    patientId: 'c1b2c3d4-3333-4333-8333-333333333333',
    format: 'PDF',
    status: 'PENDING',
    retryCount: 0,
    createdAt: '2026-10-21T15:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HttpDocumentService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(HttpDocumentService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lists a page of the patient documents through the gateway route', async () => {
    const result = service.listDocuments(2);

    const request = http.expectOne(
      (req) => req.url === '/api/v1/documents',
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('limit')).toBe('20');
    request.flush({
      data: [pending, available],
      meta: { page: 2, limit: 20, total: 22, totalPages: 2 },
    });

    const page = await result;
    expect(page.page).toBe(2);
    expect(page.totalPages).toBe(2);
    expect(page.total).toBe(22);
    expect(page.documents.map((document) => document.id)).toEqual([
      pending.id,
      available.id,
    ]);
  });

  it('keeps the generation date of an available document', async () => {
    const result = service.listDocuments(1);
    http.expectOne((req) => req.url === '/api/v1/documents').flush({
      data: [available],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const [document] = (await result).documents;
    expect(document.status).toBe('AVAILABLE');
    expect(document.status === 'AVAILABLE' && document.generatedAt).toBe(
      available.generatedAt,
    );
  });

  it('rejects a document with a status the contract does not define', async () => {
    const result = service.listDocuments(1);
    http.expectOne((req) => req.url === '/api/v1/documents').flush({
      data: [{ ...pending, status: 'ARCHIVED' }],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    await expect(result).rejects.toThrow();
  });

  it('asks for the short-lived download URL of one document', async () => {
    const result = service.getDownloadUrl(available.id);

    const request = http.expectOne(
      `/api/v1/documents/${available.id}/download`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      downloadUrl: 'http://localhost:9000/telemed-documents/x.pdf?X-Amz-Signature=abc',
      expiresAt: '2026-10-20T15:05:00Z',
    });

    expect(await result).toBe(
      'http://localhost:9000/telemed-documents/x.pdf?X-Amz-Signature=abc',
    );
  });

  it('passes on the error of the shell client unchanged', async () => {
    const result = service.getDownloadUrl(pending.id);

    http
      .expectOne(`/api/v1/documents/${pending.id}/download`)
      .flush(
        {
          error: 'BUSINESS_RULE_VIOLATION',
          message: 'the document is not available',
          traceId: 'trace-1',
        },
        { status: 422, statusText: 'Unprocessable Entity' },
      );

    await expect(result).rejects.toMatchObject({ status: 422 });
  });
});
