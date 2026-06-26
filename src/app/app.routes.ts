import { Routes } from '@angular/router';
import { CnpjImportComponent } from './components/cnpj-import/cnpj-import.component';
import { ConsultaDetalheComponent } from './components/consulta-detalhe/consulta-detalhe.component';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { HistoricoComponent } from './components/historico/historico.component';
import { LandingComponent } from './components/landing/landing.component';
import { PlanosComponent } from './components/planos/planos.component';
import { PlanosResultadoComponent } from './components/planos/planos-resultado.component';
import { PrivacidadeComponent } from './components/legal/privacidade.component';
import { CookiesComponent } from './components/legal/cookies.component';
import { TermosComponent } from './components/legal/termos.component';
import { ContaShellComponent } from './components/conta/conta-shell.component';
import { ContaPlanoComponent } from './components/conta/conta-plano.component';
import { ContaPerfilComponent } from './components/conta/conta-perfil.component';
import { ContaCobrancaComponent } from './components/conta/conta-cobranca.component';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { planosPublicGuard } from './guards/planos-public.guard';
import { ROUTE_SEO } from './seo/seo-defaults';
import { ROUTE_ANALYTICS } from './models/analytics.model';

export const routes: Routes = [
  { path: '', component: LandingComponent, data: { seo: ROUTE_SEO[''], analytics: ROUTE_ANALYTICS[''] } },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [guestGuard],
    data: { seo: ROUTE_SEO['login'], analytics: ROUTE_ANALYTICS['login'] }
  },
  {
    path: 'cadastro',
    component: RegisterComponent,
    canActivate: [guestGuard],
    data: { seo: ROUTE_SEO['cadastro'], analytics: ROUTE_ANALYTICS['cadastro'] }
  },
  {
    path: 'app',
    component: CnpjImportComponent,
    canActivate: [authGuard],
    data: { seo: ROUTE_SEO['app'], analytics: ROUTE_ANALYTICS['app'] }
  },
  {
    path: 'consulta/:jobId',
    component: ConsultaDetalheComponent,
    canActivate: [authGuard],
    data: { seo: ROUTE_SEO['consulta'], analytics: ROUTE_ANALYTICS['consulta/:jobId'] }
  },
  { path: 'historico', component: HistoricoComponent, canActivate: [authGuard], data: { seo: ROUTE_SEO['historico'], analytics: ROUTE_ANALYTICS['historico'] } },
  {
    path: 'historico/:jobId',
    component: ConsultaDetalheComponent,
    canActivate: [authGuard],
    data: { seo: ROUTE_SEO['consulta'], analytics: ROUTE_ANALYTICS['historico/:jobId'] }
  },
  {
    path: 'planos',
    component: PlanosComponent,
    canActivate: [planosPublicGuard],
    data: { seo: ROUTE_SEO['planos'], analytics: ROUTE_ANALYTICS['planos'] }
  },
  {
    path: 'planos/sucesso',
    component: PlanosResultadoComponent,
    data: { seo: ROUTE_SEO['planos/sucesso'], analytics: ROUTE_ANALYTICS['planos/sucesso'] }
  },
  {
    path: 'planos/pendente',
    component: PlanosResultadoComponent,
    data: { seo: ROUTE_SEO['planos/pendente'], analytics: ROUTE_ANALYTICS['planos/pendente'] }
  },
  {
    path: 'conta',
    component: ContaShellComponent,
    canActivate: [authGuard],
    data: { seo: ROUTE_SEO['conta'], analytics: ROUTE_ANALYTICS['conta'] },
    children: [
      { path: '', redirectTo: 'perfil', pathMatch: 'full' },
      { path: 'perfil', component: ContaPerfilComponent, data: { analytics: ROUTE_ANALYTICS['conta/perfil'] } },
      { path: 'plano', component: ContaPlanoComponent, data: { analytics: ROUTE_ANALYTICS['conta/plano'] } },
      { path: 'cobranca', component: ContaCobrancaComponent, data: { analytics: ROUTE_ANALYTICS['conta/cobranca'] } }
    ]
  },
  {
    path: 'privacidade',
    component: PrivacidadeComponent,
    data: { seo: ROUTE_SEO['privacidade'], analytics: ROUTE_ANALYTICS['privacidade'] }
  },
  {
    path: 'cookies',
    component: CookiesComponent,
    data: { seo: ROUTE_SEO['cookies'], analytics: ROUTE_ANALYTICS['cookies'] }
  },
  {
    path: 'termos',
    component: TermosComponent,
    data: { seo: ROUTE_SEO['termos'], analytics: ROUTE_ANALYTICS['termos'] }
  },
  { path: '**', redirectTo: '' }
];
