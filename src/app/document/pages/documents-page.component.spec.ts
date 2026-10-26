import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DOCUMENT_DATA_SOURCE,
  DocumentDataSource,
  DocumentPage,
} from '../data/document-data-source';
import { ConsultationDocument } from '../model/consultation-document';
import { DocumentsPageComponent } from './documents-page.component';

const available: ConsultationDocument = {
  id: 'doc-1',
  summaryId: 'sum-1',
  patientId: 'pat-1',
  format: 'PDF',
  status: 'AVAILABLE',
  retryCount: 0,
  createdAt: '2026-09-20T09:02:00Z',
  generatedAt: '2026-09-20T09:05:00Z',
};

const generating: ConsultationDocument = {
  id: 'doc-2',
  summaryId: 'sum-2',
  patientId: 'pat-1',
  format: 'PDF',
  status: 'GENERATING',
  retryCount: 0,
  createdAt: '2026-09-22T10:00:00Z',
};

const failed: ConsultationDocument = {
  id: 'doc-3',
  summaryId: 'sum-3',
  patientId: 'pat-1',
  format: 'PDF',
  status: 'ERROR',
  retryCount: 3,
  createdAt: '2026-09-28T18:30:00Z',
};

function pageOf(
  documents: readonly ConsultationDocument[],
  page = 1,
  totalPages = 1,
  total = documents.length,
): DocumentPage {
  return { documents, page, totalPages, total };
}

function sourceReturning(
  result: DocumentPage | Error,
  downloadUrl: () => Promise<string> = () => Promise.resolve('https://storage.test/doc-1.pdf'),
): DocumentDataSource {
  return {
    listDocuments: () =>
      result instanceof Error ? Promise.reject(result) : Promise.resolve(result),
    getDownloadUrl: downloadUrl,
  };
}

async function setup(source: DocumentDataSource): Promise<{
  component: DocumentsPageComponent;
  fixture: ComponentFixture<DocumentsPageComponent>;
}> {
  await TestBed.configureTestingModule({
    imports: [DocumentsPageComponent],
    providers: [{ provide: DOCUMENT_DATA_SOURCE, useValue: source }],
  }).compileComponents();

  const fixture = TestBed.createComponent(DocumentsPageComponent);
  fixture.detectChanges();
  return { component: fixture.componentInstance, fixture };
}

async function settle(fixture: ComponentFixture<DocumentsPageComponent>): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
}

function query(
  fixture: ComponentFixture<DocumentsPageComponent>,
  selector: string,
): HTMLElement | null {
  return fixture.nativeElement.querySelector(selector) as HTMLElement | null;
}

describe('DocumentsPageComponent', () => {
  afterEach(() => vi.restoreAllMocks());

  describe('view states (Anexo H)', () => {
    it('starts loading', async () => {
      const { component } = await setup({
        listDocuments: () => new Promise(() => {}),
        getDownloadUrl: () => Promise.reject(new Error('not used')),
      });

      expect(component.viewState()).toBe('loading');
    });

    it('shows the empty state when the patient has no documents', async () => {
      const { component, fixture } = await setup(sourceReturning(pageOf([])));
      await settle(fixture);

      expect(component.viewState()).toBe('empty');
      expect(query(fixture, '[data-testid="documents-empty"]')).not.toBeNull();
    });

    it('shows the documents of the first page', async () => {
      const listDocuments = vi.fn(() => Promise.resolve(pageOf([available, generating])));
      const { component, fixture } = await setup({
        listDocuments,
        getDownloadUrl: () => Promise.reject(new Error('not used')),
      });
      await settle(fixture);

      expect(listDocuments).toHaveBeenCalledWith(1);
      expect(component.viewState()).toBe('data');
      expect(component.documents().map((document) => document.id)).toEqual(['doc-1', 'doc-2']);
    });

    it('shows the error state and loads again on retry', async () => {
      const listDocuments = vi
        .fn<DocumentDataSource['listDocuments']>()
        .mockRejectedValueOnce(new Error('network'))
        .mockResolvedValueOnce(pageOf([available]));
      const { component, fixture } = await setup({
        listDocuments,
        getDownloadUrl: () => Promise.reject(new Error('not used')),
      });
      await settle(fixture);
      expect(component.viewState()).toBe('error');

      query(fixture, '[data-testid="documents-retry-load"]')?.click();
      await settle(fixture);

      expect(component.viewState()).toBe('data');
    });
  });

  it('keeps the answer of the newest request when an older one arrives later', async () => {
    let answerFirst: (page: DocumentPage) => void = () => {};
    const listDocuments = vi
      .fn<DocumentDataSource['listDocuments']>()
      .mockReturnValueOnce(new Promise((resolve) => (answerFirst = resolve)))
      .mockResolvedValueOnce(pageOf([generating]));
    const { component, fixture } = await setup({
      listDocuments,
      getDownloadUrl: () => Promise.reject(new Error('not used')),
    });

    await component.retryLoad();
    answerFirst(pageOf([available]));
    await settle(fixture);

    expect(component.documents().map((document) => document.id)).toEqual(['doc-2']);
  });

  it('counts every document of the patient, not only the loaded page', async () => {
    const { fixture } = await setup(sourceReturning(pageOf([available], 1, 2, 21)));
    await settle(fixture);

    expect(query(fixture, '.documents__counter')?.textContent?.trim()).toBe('21 documentos');
  });

  describe('download', () => {
    it('opens the short-lived URL issued by the API', async () => {
      const open = vi.spyOn(window, 'open').mockReturnValue(null);
      const { component, fixture } = await setup(sourceReturning(pageOf([available])));
      await settle(fixture);

      await component.downloadDocument(available);

      expect(open).toHaveBeenCalledWith('https://storage.test/doc-1.pdf', '_blank', 'noopener');
      expect(component.downloadingDocumentId()).toBeNull();
    });

    it('disables the button while the URL is requested', async () => {
      vi.spyOn(window, 'open').mockReturnValue(null);
      const { component, fixture } = await setup(
        sourceReturning(pageOf([available]), () => new Promise(() => {})),
      );
      await settle(fixture);

      void component.downloadDocument(available);
      fixture.detectChanges();

      const button = query(fixture, '[data-testid="document-download"]') as HTMLButtonElement;
      expect(button.disabled).toBe(true);
    });

    it('shows the message of the API next to the document when it fails', async () => {
      const { component, fixture } = await setup(
        sourceReturning(
          pageOf([available]),
          () => Promise.reject({ status: 503, code: 'SERVICE_UNAVAILABLE', message: 'storage unavailable', traceId: 't-1' }),
        ),
      );
      await settle(fixture);

      await component.downloadDocument(available);
      fixture.detectChanges();

      const alert = query(fixture, '[data-testid="document-download-error"]');
      expect(alert?.getAttribute('role')).toBe('alert');
      expect(alert?.textContent).toContain('storage unavailable');
      expect(alert?.textContent).toContain('t-1');
    });

    it('shows its own message when the answer breaks the contract', async () => {
      const { component, fixture } = await setup(
        sourceReturning(pageOf([available]), () => Promise.reject(new Error('Document d-1 has no URL.'))),
      );
      await settle(fixture);

      await component.downloadDocument(available);
      fixture.detectChanges();

      const alert = query(fixture, '[data-testid="document-download-error"]');
      expect(alert?.textContent).toContain('No pudimos descargar el PDF.');
      expect(alert?.textContent).not.toContain('has no URL');
    });
  });

  it('explains a failed document without offering a retry the API does not have (DEC-005)', async () => {
    const { fixture } = await setup(sourceReturning(pageOf([failed])));
    await settle(fixture);

    expect(query(fixture, '[data-testid="document-failed"]')?.textContent).toContain(
      'No pudimos generar este PDF',
    );
    expect(query(fixture, '[data-testid="document-retry"]')).toBeNull();
  });

  describe('pages', () => {
    it('loads the next page and appends it until the last one', async () => {
      const listDocuments = vi
        .fn<DocumentDataSource['listDocuments']>()
        .mockResolvedValueOnce(pageOf([available], 1, 2, 2))
        .mockResolvedValueOnce(pageOf([generating], 2, 2, 2));
      const { component, fixture } = await setup({
        listDocuments,
        getDownloadUrl: () => Promise.reject(new Error('not used')),
      });
      await settle(fixture);

      query(fixture, '[data-testid="documents-load-more"]')?.click();
      await settle(fixture);

      expect(listDocuments).toHaveBeenLastCalledWith(2);
      expect(component.documents().map((document) => document.id)).toEqual(['doc-1', 'doc-2']);
      expect(query(fixture, '[data-testid="documents-load-more"]')).toBeNull();
    });
  });

  it('formats ISO dates in es-CO', async () => {
    const { component } = await setup(sourceReturning(pageOf([])));

    expect(component.formatDate('2026-09-20T09:05:00Z')).toBe('20 de septiembre de 2026');
  });
});
