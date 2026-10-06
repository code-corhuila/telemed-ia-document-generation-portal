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
 */
export interface ConsultationDocument {
  readonly documentId: string;
  readonly summaryId: string;
  readonly patientId: string;
  readonly format: 'PDF';
  readonly status: DocumentStatus;
  readonly errorMessage: string | null;
  readonly retryCount: number;
  readonly generatedAt: string | null;
  readonly createdAt: string;
  readonly downloadUrl: string | null;
}
