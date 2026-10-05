import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-documents-page',
  standalone: true,
  template: '<h1>Mis Documentos</h1>',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentsPageComponent {}
