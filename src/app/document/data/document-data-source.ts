import { InjectionToken } from '@angular/core';

import { ConsultationDocument } from '../model/consultation-document';

/**
 * Port that the document-generation portal uses to fetch its data.
 *
 * In development it is satisfied by SyntheticDocumentService (mock data).
 * In production it will be satisfied by an adapter that calls the
 * document-generation -api through the shell's apiClient.
 */
export interface DocumentDataSource {
  listDocuments(): Promise<readonly ConsultationDocument[]>;
}

export const DOCUMENT_DATA_SOURCE =
  new InjectionToken<DocumentDataSource>('DOCUMENT_DATA_SOURCE');
