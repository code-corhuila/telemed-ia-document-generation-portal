import { SyntheticDocumentService } from '../data/synthetic-document.service';
import {
  AvailableConsultationDocument,
  ConsultationDocument,
  ErrorConsultationDocument,
} from './consultation-document';

function isAvailable(
  doc: ConsultationDocument,
): doc is AvailableConsultationDocument {
  return doc.status === 'AVAILABLE';
}

function isError(
  doc: ConsultationDocument,
): doc is ErrorConsultationDocument {
  return doc.status === 'ERROR';
}

describe('SyntheticDocumentService', () => {
  const service = new SyntheticDocumentService();

  it('returns five documents', async () => {
    const documents = await service.listDocuments();
    expect(documents.length).toBe(5);
  });

  it('covers every status at least once', async () => {
    const documents = await service.listDocuments();
    const statuses = new Set(documents.map((d) => d.status));
    expect(statuses.has('AVAILABLE')).toBe(true);
    expect(statuses.has('GENERATING')).toBe(true);
    expect(statuses.has('PENDING')).toBe(true);
    expect(statuses.has('ERROR')).toBe(true);
  });

  it('every AVAILABLE document carries downloadUrl and generatedAt', async () => {
    const documents = await service.listDocuments();
    for (const doc of documents) {
      if (isAvailable(doc)) {
        expect(typeof doc.downloadUrl).toBe('string');
        expect(doc.downloadUrl.length).toBeGreaterThan(0);
        expect(typeof doc.generatedAt).toBe('string');
        expect(doc.generatedAt.length).toBeGreaterThan(0);
      }
    }
  });

  it('every ERROR document carries an errorMessage', async () => {
    const documents = await service.listDocuments();
    for (const doc of documents) {
      if (isError(doc)) {
        expect(typeof doc.errorMessage).toBe('string');
        expect(doc.errorMessage.length).toBeGreaterThan(0);
      }
    }
  });

  it('always sets format to PDF', async () => {
    const documents = await service.listDocuments();
    for (const doc of documents) {
      expect(doc.format).toBe('PDF');
    }
  });
});
