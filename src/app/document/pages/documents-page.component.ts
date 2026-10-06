import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  DOCUMENT_DATA_SOURCE,
  DocumentDataSource,
} from '../data/document-data-source';
import { ConsultationDocument } from '../model/consultation-document';

type ViewState = 'loading' | 'error' | 'empty' | 'data';

@Component({
  selector: 'app-documents-page',
  standalone: true,
  templateUrl: './documents-page.component.html',
  styleUrl: './documents-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsPageComponent {
  private readonly dataSource: DocumentDataSource =
    inject(DOCUMENT_DATA_SOURCE);

  readonly viewState = signal<ViewState>('loading');
  readonly documents = signal<readonly ConsultationDocument[]>([]);
  readonly downloadingDocumentId = signal<string | null>(null);
  readonly retryingDocumentId = signal<string | null>(null);

  private readonly retryKeys = new Map<string, string>();

  constructor() {
    void this.load();
  }

  async retryLoad(): Promise<void> {
    await this.load();
  }

  async downloadDocument(doc: ConsultationDocument): Promise<void> {
    if (
      doc.status !== 'AVAILABLE' ||
      this.downloadingDocumentId() === doc.documentId
    ) {
      return;
    }

    this.downloadingDocumentId.set(doc.documentId);

    try {
      const blob = await this.dataSource.downloadDocument(doc.documentId);
      this.triggerBrowserDownload(blob, `${doc.documentId}.pdf`);
    } catch (error: unknown) {
      console.error(`Failed to download document ${doc.documentId}.`, error);
    } finally {
      this.downloadingDocumentId.set(null);
    }
  }

  async retryDocument(doc: ConsultationDocument): Promise<void> {
    if (
      doc.status !== 'ERROR' ||
      this.retryingDocumentId() === doc.documentId
    ) {
      return;
    }

    this.retryingDocumentId.set(doc.documentId);

    const idempotencyKey =
      this.retryKeys.get(doc.documentId) ?? crypto.randomUUID();
    this.retryKeys.set(doc.documentId, idempotencyKey);

    try {
      const updated = await this.dataSource.retryDocument(
        doc.documentId,
        idempotencyKey,
      );
      this.replaceDocument(updated);
      this.retryKeys.delete(doc.documentId);
    } catch (error: unknown) {
      console.error(`Failed to retry document ${doc.documentId}.`, error);
    } finally {
      this.retryingDocumentId.set(null);
    }
  }

  formatDate(isoDate: string): string {
    const formatter = new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return formatter.format(new Date(isoDate));
  }

  private replaceDocument(updated: ConsultationDocument): void {
    this.documents.update((current) =>
      current.map((document) =>
        document.documentId === updated.documentId ? updated : document,
      ),
    );
  }

  private triggerBrowserDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private async load(): Promise<void> {
    this.viewState.set('loading');
    try {
      const documents = await this.dataSource.listDocuments();
      this.documents.set(documents);
      this.viewState.set(documents.length === 0 ? 'empty' : 'data');
    } catch {
      this.viewState.set('error');
    }
  }
}
