import { Injectable } from '@angular/core';

import {
  AvailableConsultationDocument,
  ConsultationDocument,
  ErrorConsultationDocument,
  GeneratingConsultationDocument,
  PendingConsultationDocument,
} from '../model/consultation-document';
import { DocumentDataSource } from './document-data-source';

/**
 * In-memory mock data source for the document-generation portal.
 *
 * Returns five documents covering every status the UI must handle:
 * AVAILABLE (with a download URL), GENERATING, PENDING, ERROR (with a
 * message and a retry count), and one extra AVAILABLE to give the list
 * some variety.
 *
 * No clinical data is included on purpose. The portal must be able to
 * render each card using only the fields defined in the discriminated union.
 */
@Injectable()
export class SyntheticDocumentService implements DocumentDataSource {
  private readonly retryOutcomes = new Map<string, ConsultationDocument>();

  async listDocuments(): Promise<readonly ConsultationDocument[]> {
    await this.delay(400);

    const available1: AvailableConsultationDocument = {
      documentId: 'a1b2c3d4-1111-4111-8111-111111111111',
      summaryId: 'b1b2c3d4-2222-4222-8222-222222222222',
      patientId: 'c1b2c3d4-3333-4333-8333-333333333333',
      format: 'PDF',
      status: 'AVAILABLE',
      retryCount: 0,
      createdAt: '2026-09-20T09:02:00Z',
      downloadUrl: 'https://example.invalid/presigned/1',
      generatedAt: '2026-09-20T09:05:00Z',
    };

    const generating: GeneratingConsultationDocument = {
      documentId: 'a1b2c3d4-4444-4444-8444-444444444444',
      summaryId: 'b1b2c3d4-5555-4555-8555-555555555555',
      patientId: 'c1b2c3d4-3333-4333-8333-333333333333',
      format: 'PDF',
      status: 'GENERATING',
      retryCount: 0,
      createdAt: '2026-10-01T15:42:00Z',
    };

    const pending: PendingConsultationDocument = {
      documentId: 'a1b2c3d4-6666-4666-8666-666666666666',
      summaryId: 'b1b2c3d4-7777-4777-8777-777777777777',
      patientId: 'c1b2c3d4-3333-4333-8333-333333333333',
      format: 'PDF',
      status: 'PENDING',
      retryCount: 0,
      createdAt: '2026-10-05T11:15:00Z',
    };

    const error: ErrorConsultationDocument = {
      documentId: 'a1b2c3d4-8888-4888-8888-888888888888',
      summaryId: 'b1b2c3d4-9999-4999-8999-999999999999',
      patientId: 'c1b2c3d4-3333-4333-8333-333333333333',
      format: 'PDF',
      status: 'ERROR',
      retryCount: 3,
      createdAt: '2026-09-28T18:30:00Z',
      errorMessage: 'PDF generation failed after 3 attempts.',
    };

    const available2: AvailableConsultationDocument = {
      documentId: 'a1b2c3d4-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      summaryId: 'b1b2c3d4-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      patientId: 'c1b2c3d4-3333-4333-8333-333333333333',
      format: 'PDF',
      status: 'AVAILABLE',
      retryCount: 0,
      createdAt: '2026-09-15T08:18:00Z',
      downloadUrl: 'https://example.invalid/presigned/2',
      generatedAt: '2026-09-15T08:20:00Z',
    };

    return [available1, generating, pending, error, available2];
  }

  async downloadDocument(_documentId: string): Promise<Blob> {
    await this.delay(200);

    const minimalPdf =
      '%PDF-1.4\n' +
      '1 0 obj<</Type/Catalog>>endobj\n' +
      'trailer<</Root 1 0 R>>\n' +
      '%%EOF\n';

    return new Blob([minimalPdf], { type: 'application/pdf' });
  }

  async retryDocument(
    documentId: string,
    idempotencyKey: string,
  ): Promise<ConsultationDocument> {
    await this.delay(300);

    const cached = this.retryOutcomes.get(idempotencyKey);
    if (cached) {
      return cached;
    }

    const documents = await this.listDocuments();
    const target = documents.find((document) => document.documentId === documentId);

    if (!target) {
      throw new Error(`Document ${documentId} not found.`);
    }

    if (target.status !== 'ERROR') {
      this.retryOutcomes.set(idempotencyKey, target);
      return target;
    }

    const updated: ConsultationDocument = {
      documentId: target.documentId,
      summaryId: target.summaryId,
      patientId: target.patientId,
      format: 'PDF',
      status: 'GENERATING',
      retryCount: target.retryCount + 1,
      createdAt: target.createdAt,
    };

    this.retryOutcomes.set(idempotencyKey, updated);
    return updated;
  }

  private delay(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }
}
