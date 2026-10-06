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
import { SyntheticDocumentService } from '../data/synthetic-document.service';
import { ConsultationDocument } from '../model/consultation-document';

type ViewState = 'loading' | 'error' | 'empty' | 'data';

@Component({
  selector: 'app-documents-page',
  standalone: true,
  templateUrl: './documents-page.component.html',
  styleUrl: './documents-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    SyntheticDocumentService,
    {
      provide: DOCUMENT_DATA_SOURCE,
      useExisting: SyntheticDocumentService,
    },
  ],
})
export class DocumentsPageComponent {
  private readonly dataSource: DocumentDataSource =
    inject(DOCUMENT_DATA_SOURCE);

  readonly viewState = signal<ViewState>('loading');
  readonly documents = signal<readonly ConsultationDocument[]>([]);

  constructor() {
    void this.load();
  }

  async retryLoad(): Promise<void> {
    await this.load();
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
