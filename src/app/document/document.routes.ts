import { Routes } from '@angular/router';

export const DOCUMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/documents-page.component').then(
        (m) => m.DocumentsPageComponent,
      ),
  },
];
