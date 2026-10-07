import { Routes } from '@angular/router';

import { DOCUMENT_DATA_SOURCE } from './data/document-data-source';
import { SyntheticDocumentService } from './data/synthetic-document.service';

export const DOCUMENT_ROUTES: Routes = [
  {
    path: '',
    providers: [
      SyntheticDocumentService,
      {
        provide: DOCUMENT_DATA_SOURCE,
        useExisting: SyntheticDocumentService,
      },
    ],
    loadComponent: () =>
      import('./pages/documents-page.component').then(
        (m) => m.DocumentsPageComponent,
      ),
  },
];
