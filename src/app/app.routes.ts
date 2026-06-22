import { Routes } from '@angular/router';
import { CnpjImportComponent } from './components/cnpj-import/cnpj-import.component';
import { ConsultaDetalheComponent } from './components/consulta-detalhe/consulta-detalhe.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { HistoricoComponent } from './components/historico/historico.component';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'cadastro', component: RegisterComponent, canActivate: [guestGuard] },
  { path: '', component: CnpjImportComponent, canActivate: [authGuard] },
  { path: 'consulta/:jobId', component: ConsultaDetalheComponent, canActivate: [authGuard] },
  { path: 'historico', component: HistoricoComponent, canActivate: [authGuard] },
  { path: 'historico/:jobId', component: ConsultaDetalheComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '' }
];
