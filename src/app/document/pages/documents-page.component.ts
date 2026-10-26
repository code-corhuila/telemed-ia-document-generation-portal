import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  DOCUMENT_DATA_SOURCE,
  DocumentDataSource,
} from '../data/document-data-source';
import { ConsultationDocument } from '../model/consultation-document';
import { asApiError } from '../../shell-contract';

type ViewState = 'loading' | 'error' | 'empty' | 'data';

/** A failed download, shown next to its document. */
interface DownloadFailure {
  readonly documentId: string;
  readonly message: string;
  readonly traceId?: string;
}

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
  readonly total = signal(0);
  readonly loadingMore = signal(false);
  readonly downloadingDocumentId = signal<string | null>(null);
  readonly downloadFailure = signal<DownloadFailure | null>(null);

  private readonly page = signal(1);
  private readonly totalPages = signal(1);
  readonly hasMore = computed(() => this.page() < this.totalPages());

  /** Only the answer of the newest request is shown (Anexo H). */
  private latestRequest = 0;

  constructor() {
    void this.load();
  }

  async retryLoad(): Promise<void> {
    await this.load();
  }

  async loadMore(): Promise<void> {
    if (this.loadingMore() || !this.hasMore()) {
      return;
    }
    const request = ++this.latestRequest;
    this.loadingMore.set(true);
    try {
      const next = await this.dataSource.listDocuments(this.page() + 1);
      if (request !== this.latestRequest) {
        return;
      }
      this.documents.update((current) => [...current, ...next.documents]);
      this.page.set(next.page);
      this.totalPages.set(next.totalPages);
      this.total.set(next.total);
    } catch {
      if (request === this.latestRequest) {
        this.viewState.set('error');
      }
    } finally {
      this.loadingMore.set(false);
    }
  }

  async downloadDocument(doc: ConsultationDocument): Promise<void> {
    if (doc.status !== 'AVAILABLE' || this.downloadingDocumentId() === doc.id) {
      return;
    }
    this.downloadingDocumentId.set(doc.id);
    this.downloadFailure.set(null);
    try {
      const url = await this.dataSource.getDownloadUrl(doc.id);
      window.open(url, '_blank', 'noopener');
    } catch (error: unknown) {
      this.downloadFailure.set(toFailure(doc.id, error));
    } finally {
      this.downloadingDocumentId.set(null);
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

  private async load(): Promise<void> {
    const request = ++this.latestRequest;
    this.viewState.set('loading');
    try {
      const first = await this.dataSource.listDocuments(1);
      if (request !== this.latestRequest) {
        return;
      }
      this.documents.set(first.documents);
      this.page.set(first.page);
      this.totalPages.set(first.totalPages);
      this.total.set(first.total);
      this.viewState.set(first.documents.length === 0 ? 'empty' : 'data');
    } catch {
      if (request === this.latestRequest) {
        this.viewState.set('error');
      }
    }
  }
}

function toFailure(documentId: string, error: unknown): DownloadFailure {
  const { message, traceId } = asApiError(error, 'No pudimos descargar el PDF.');
  return { documentId, message, traceId };
}
