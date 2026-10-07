import {
  ApplicationConfig,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { DOCUMENT_DATA_SOURCE } from './document/data/document-data-source';
import { SyntheticDocumentService } from './document/data/synthetic-document.service';
import { DOCUMENT_ROUTES } from './document/document.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(DOCUMENT_ROUTES),
    SyntheticDocumentService,
    {
      provide: DOCUMENT_DATA_SOURCE,
      useExisting: SyntheticDocumentService,
    },
  ],
};
