import { InjectionToken } from '@angular/core';

import { ConsultationDocument } from '../model/consultation-document';

/** One page of the patient's documents, most recent first. */
export interface DocumentPage {
  readonly documents: readonly ConsultationDocument[];
  readonly page: number;
  readonly totalPages: number;
  /** Every document of the patient, across all pages. */
  readonly total: number;
}

/**
 * Port that the document-generation portal uses to fetch its data. It is
 * satisfied by HttpDocumentService, which calls the document-generation -api
 * through the shell's HttpClient.
 *
 * Failures reject with the error the shell client normalised (ApiError:
 * status, code, message, traceId).
 */
export interface DocumentDataSource {
  /** Page numbers start at 1. */
  listDocuments(page: number): Promise<DocumentPage>;

  /** Short-lived URL of the PDF; only for an AVAILABLE document. */
  getDownloadUrl(documentId: string): Promise<string>;
}

export const DOCUMENT_DATA_SOURCE =
  new InjectionToken<DocumentDataSource>('DOCUMENT_DATA_SOURCE');
