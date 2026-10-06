import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import {
  DOCUMENT_DATA_SOURCE,
  DocumentDataSource,
} from '../data/document-data-source';
import { ConsultationDocument } from '../model/consultation-document';
import { DocumentsPageComponent } from './documents-page.component';

function buildMockSource(
  result: readonly ConsultationDocument[] | Error,
): DocumentDataSource {
  return {
    listDocuments: () =>
      result instanceof Error ? Promise.reject(result) : Promise.resolve(result),
    downloadDocument: () =>
      Promise.resolve(new Blob(['%PDF-1.4\n'], { type: 'application/pdf' })),
    retryDocument: (documentId: string, _idempotencyKey: string) =>
      Promise.resolve({
        documentId,
        summaryId: 'sum-1',
        patientId: 'pat-1',
        format: 'PDF',
        status: 'GENERATING',
        retryCount: 1,
        createdAt: '2026-09-28T18:30:00Z',
      }),
  };
}

const oneAvailable: ConsultationDocument = {
  documentId: 'doc-1',
  summaryId: 'sum-1',
  patientId: 'pat-1',
  format: 'PDF',
  status: 'AVAILABLE',
  retryCount: 0,
  createdAt: '2026-09-20T09:02:00Z',
  downloadUrl: 'https://example.invalid/presigned/1',
  generatedAt: '2026-09-20T09:05:00Z',
};

async function setup(
  source: DocumentDataSource,
): Promise<DocumentsPageComponent> {
  await TestBed.configureTestingModule({
    imports: [DocumentsPageComponent],
  })
    .overrideComponent(DocumentsPageComponent, {
      set: {
        providers: [{ provide: DOCUMENT_DATA_SOURCE, useValue: source }],
      },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(DocumentsPageComponent);
  return fixture.componentInstance;
}

describe('DocumentsPageComponent', () => {
  it('starts in loading state', async () => {
    const source: DocumentDataSource = {
      listDocuments: () => new Promise(() => {}),
      downloadDocument: () =>
        Promise.resolve(new Blob([], { type: 'application/pdf' })),
      retryDocument: () => Promise.reject(new Error('Not used in this test.')),
    };
    const component = await setup(source);
    expect(component.viewState()).toBe('loading');
  });

  it('reaches empty state when the source returns no documents', async () => {
    const component = await setup(buildMockSource([]));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(component.viewState()).toBe('empty');
  });

  it('reaches data state when the source returns documents', async () => {
    const component = await setup(buildMockSource([oneAvailable]));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(component.viewState()).toBe('data');
    expect(component.documents().length).toBe(1);
  });

  it('reaches error state when the source rejects', async () => {
    const component = await setup(buildMockSource(new Error('boom')));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(component.viewState()).toBe('error');
  });

  it('formats ISO dates in es-CO', async () => {
    const component = await setup(buildMockSource([]));
    expect(component.formatDate('2026-09-20T09:05:00Z')).toBe(
      '20 de septiembre de 2026',
    );
  });

  it('downloadDocument triggers a Blob download when status is AVAILABLE', async () => {
    const component = await setup(buildMockSource([oneAvailable]));
    await new Promise((resolve) => setTimeout(resolve, 0));

    const createObjectUrl = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:test');
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    await component.downloadDocument(oneAvailable);

    expect(createObjectUrl).toHaveBeenCalledWith(
      expect.any(Blob),
    );
    expect(click).toHaveBeenCalled();
    expect(component.downloadingDocumentId()).toBeNull();
    vi.restoreAllMocks();
  });

  it('retryDocument replaces the document with the updated one', async () => {
    const source = buildMockSource([oneAvailable]);
    const retry = vi.spyOn(source, 'retryDocument');
    const component = await setup(source);
    await new Promise((resolve) => setTimeout(resolve, 0));

    const errorDoc: ConsultationDocument = {
      documentId: 'doc-error',
      summaryId: 'sum-2',
      patientId: 'pat-1',
      format: 'PDF',
      status: 'ERROR',
      errorMessage: 'boom',
      retryCount: 2,
      createdAt: '2026-09-28T18:30:00Z',
    };
    component.documents.set([errorDoc]);

    await component.retryDocument(errorDoc);

    expect(retry).toHaveBeenCalledWith('doc-error', expect.any(String));
    expect(component.documents()[0].status).toBe('GENERATING');
    expect(component.retryingDocumentId()).toBeNull();
  });
});
