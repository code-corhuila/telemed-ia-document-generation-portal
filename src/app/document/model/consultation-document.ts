import { DocumentStatus } from './document-status';

/**
 * Metadata of a PDF generated for a consultation summary.
 *
 * This is the mirror of the -api contract. It contains no clinical
 * information: no doctor, no specialty, no consultation date. That data
 * lives in consultation-service and is deliberately out of scope here.
 *
 * The binary of the PDF never crosses this boundary. When the document is
 * AVAILABLE, `downloadUrl` carries a short-lived presigned URL issued by
 * the -api; the storage reference itself is not exposed to the client.
 *
 * The type is a discriminated union on `status` so that the nullability
 * invariants are enforced by the type system rather than by convention:
 *   - AVAILABLE implies non-null downloadUrl and generatedAt.
 *   - ERROR implies non-null errorMessage.
 *   - PENDING and GENERATING carry neither.
 */
export interface BaseConsultationDocument {
  readonly documentId: string;
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
  readonly downloadUrl: string;
  readonly generatedAt: string;
}

export interface ErrorConsultationDocument extends BaseConsultationDocument {
  readonly status: 'ERROR';
  readonly errorMessage: string;
}

export type ConsultationDocument =
  | PendingConsultationDocument
  | GeneratingConsultationDocument
  | AvailableConsultationDocument
  | ErrorConsultationDocument;
