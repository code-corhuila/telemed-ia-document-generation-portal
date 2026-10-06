import { SyntheticDocumentService } from '../data/synthetic-document.service';
import { ConsultationDocument } from './consultation-document';

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

  it('only exposes a download URL when status is AVAILABLE', async () => {
    const documents = await service.listDocuments();
    for (const doc of documents) {
      if (doc.status === 'AVAILABLE') {
        expect(doc.downloadUrl).not.toBeNull();
        expect(doc.generatedAt).not.toBeNull();
      } else {
        expect(doc.downloadUrl).toBeNull();
        expect(doc.generatedAt).toBeNull();
      }
    }
  });

  it('only exposes an error message when status is ERROR', async () => {
    const documents: readonly ConsultationDocument[] =
      await service.listDocuments();
    for (const doc of documents) {
      if (doc.status === 'ERROR') {
        expect(doc.errorMessage).not.toBeNull();
      } else {
        expect(doc.errorMessage).toBeNull();
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
