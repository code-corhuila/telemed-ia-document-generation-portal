import { Routes } from '@angular/router';

import { DOCUMENT_DATA_SOURCE } from './data/document-data-source';
import { SyntheticDocumentService } from './data/synthetic-document.service';

/**
 * Route table exposed to the shell via Module Federation (`./routes`).
 *
 * IMPORTANT: the providers below MUST stay at this route level, not in
 * app.config.ts. When the shell loads this portal through
 * `loadRemoteModule('./routes')`, it does NOT evaluate the portal's
 * app.config.ts — only this route table. If the providers were moved back
 * to app.config.ts, DI would throw NG0201 at runtime inside the shell
 * (see PR #8 for the full diagnosis).
 *
 * If this route table grows more entries, either:
 * - hoist the providers to a parent route wrapping all children, or
 * - declare the providers on each new route that needs them.
 * Otherwise the new route will fail to resolve DOCUMENT_DATA_SOURCE with
 * the same NG0201 error, while the existing route keeps working.
 */
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
