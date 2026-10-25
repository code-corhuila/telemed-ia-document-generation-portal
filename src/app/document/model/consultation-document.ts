import { DocumentStatus } from './document-status';

/**
 * Metadata of a PDF generated for a consultation summary: the
 * `ConsultationDocument` schema of `07-api/contracts/openapi/document-service.yaml`.
 *
 * It contains no clinical information: no doctor, no specialty, no
 * consultation date. That data lives in consultation-service.
 *
 * The API never returns the PDF, its storage reference or the internal error
 * message (ADR-015). A download URL is requested separately and is valid for
 * five minutes, so it is not part of this model.
 *
 * The type is a discriminated union on `status`, so the invariant of the
 * contract is enforced by the type system: only AVAILABLE has `generatedAt`.
 */
export interface BaseConsultationDocument {
  readonly id: string;
  readonly summaryId: string;
  readonly patientId: string;
  readonly format: 'PDF';
  readonly retryCount: number;
  readonly createdAt: string;
}

export interface PendingConsultationDocument extends BaseConsultationDocument {
  readonly status: 'PENDING';
}

export interface GeneratingConsultationDocument
  extends BaseConsultationDocument {
  readonly status: 'GENERATING';
}

export interface AvailableConsultationDocument extends BaseConsultationDocument {
  readonly status: 'AVAILABLE';
  readonly generatedAt: string;
}

/** Generation ran out of its retries (DEC-005); there is no manual retry. */
export interface ErrorConsultationDocument extends BaseConsultationDocument {
  readonly status: 'ERROR';
}

export type ConsultationDocument =
  | PendingConsultationDocument
  | GeneratingConsultationDocument
  | AvailableConsultationDocument
  | ErrorConsultationDocument;

export const DOCUMENT_STATUSES: readonly DocumentStatus[] = [
  'PENDING',
  'GENERATING',
  'AVAILABLE',
  'ERROR',
];
