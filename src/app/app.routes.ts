import { Routes } from '@angular/router';
import { CnpjImportComponent } from './components/cnpj-import/cnpj-import.component';
import { ConsultaDetalheComponent } from './components/consulta-detalhe/consulta-detalhe.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { HistoricoComponent } from './components/historico/historico.component';
import { LandingComponent } from './components/landing/landing.component';
import { PlanosComponent } from './components/planos/planos.component';
import { PlanosResultadoComponent } from './components/planos/planos-resultado.component';
import { ContaShellComponent } from './components/conta/conta-shell.component';
import { ContaPlanoComponent } from './components/conta/conta-plano.component';
import { ContaPerfilComponent } from './components/conta/conta-perfil.component';
import { ContaCobrancaComponent } from './components/conta/conta-cobranca.component';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { planosPublicGuard } from './guards/planos-public.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'cadastro', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'app', component: CnpjImportComponent, canActivate: [authGuard] },
  { path: 'consulta/:jobId', component: ConsultaDetalheComponent, canActivate: [authGuard] },
  { path: 'historico', component: HistoricoComponent, canActivate: [authGuard] },
  { path: 'historico/:jobId', component: ConsultaDetalheComponent, canActivate: [authGuard] },
  { path: 'planos', component: PlanosComponent, canActivate: [planosPublicGuard] },
  { path: 'planos/sucesso', component: PlanosResultadoComponent },
  { path: 'planos/pendente', component: PlanosResultadoComponent },
  {
    path: 'conta',
    component: ContaShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'perfil', pathMatch: 'full' },
      { path: 'perfil', component: ContaPerfilComponent },
      { path: 'plano', component: ContaPlanoComponent },
      { path: 'cobranca', component: ContaCobrancaComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
