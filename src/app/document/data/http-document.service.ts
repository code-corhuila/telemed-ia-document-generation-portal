import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import {
  ConsultationDocument,
  DOCUMENT_STATUSES,
} from '../model/consultation-document';
import { DocumentStatus } from '../model/document-status';
import { DocumentDataSource, DocumentPage } from './document-data-source';

/** Public route of the gateway (Anexo H): only the shell knows its host. */
const DOCUMENTS = '/api/v1/documents';

/** Documents per page; the contract allows 1 to 100. */
const PAGE_SIZE = 20;

interface DocumentResponse {
  readonly id: string;
  readonly summaryId: string;
  readonly patientId: string;
  readonly status: string;
  readonly retryCount: number;
  readonly createdAt: string;
  readonly generatedAt?: string | null;
}

interface DocumentListResponse {
  readonly data: readonly DocumentResponse[];
  readonly meta: {
    readonly page: number;
    readonly total: number;
    readonly totalPages: number;
  };
}

interface DocumentDownloadResponse {
  readonly downloadUrl: string;
}

/**
 * Adapter of the document-generation -api, contract
 * `07-api/contracts/openapi/document-service.yaml`. It uses the HttpClient of
 * the shell, whose interceptor adds the token and the correlation id, applies
 * the timeout and normalises errors; the portal never provides its own client.
 */
@Injectable()
export class HttpDocumentService implements DocumentDataSource {
  private readonly http = inject(HttpClient);

  async listDocuments(page: number): Promise<DocumentPage> {
    const response = await firstValueFrom(
      this.http.get<DocumentListResponse>(DOCUMENTS, {
        params: { page, limit: PAGE_SIZE },
      }),
    );
    return {
      documents: response.data.map(toDocument),
      page: response.meta.page,
      totalPages: response.meta.totalPages,
      total: response.meta.total,
    };
  }

  async getDownloadUrl(documentId: string): Promise<string> {
    const response = await firstValueFrom(
      this.http.get<DocumentDownloadResponse>(
        `${DOCUMENTS}/${encodeURIComponent(documentId)}/download`,
      ),
    );
    return response.downloadUrl;
  }
}

function toDocument(response: DocumentResponse): ConsultationDocument {
  const base = {
    id: response.id,
    summaryId: response.summaryId,
    patientId: response.patientId,
    format: 'PDF' as const,
    retryCount: response.retryCount,
    createdAt: response.createdAt,
  };
  const status = toStatus(response.status);
  if (status === 'AVAILABLE') {
    if (!response.generatedAt) {
      throw new Error(`Document ${response.id} is AVAILABLE without generatedAt.`);
    }
    return { ...base, status, generatedAt: response.generatedAt };
  }
  return { ...base, status };
}

function toStatus(status: string): DocumentStatus {
  if (!(DOCUMENT_STATUSES as readonly string[]).includes(status)) {
    throw new Error(`Unknown document status: ${status}.`);
  }
  return status as DocumentStatus;
}
