import { Routes } from '@angular/router';
import { CnpjImportComponent } from './components/cnpj-import/cnpj-import.component';
import { ConsultaDetalheComponent } from './components/consulta-detalhe/consulta-detalhe.component';

export const routes: Routes = [
  { path: '', component: CnpjImportComponent },
  { path: 'consulta/:jobId', component: ConsultaDetalheComponent },
  { path: '**', redirectTo: '' }
];
