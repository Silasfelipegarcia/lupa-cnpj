import { RouteSeoConfig } from '../models/seo.model';
import { landingJsonLd, planosOffersJsonLd, consultaCnpjJsonLd } from './structured-data';

export const DEFAULT_SEO: RouteSeoConfig = {
  title: 'Consulta e enriquecimento de CNPJ em lote | Lupa Insights',
  description:
    'Enriqueça listas de empresas com dados cadastrais oficiais. Consulta CNPJ em planilha, filtros comerciais e exportação Excel para prospecção B2B.',
  index: true
};

export const ROUTE_SEO: Record<string, RouteSeoConfig> = {
  '': {
    title: 'Lupa Insights — Prospecção B2B em lote',
    description:
      'Plataforma para equipes comerciais enriquecerem listas de empresas com dados cadastrais oficiais, filtros comerciais e exportação Excel para o CRM.',
    index: true,
    jsonLd: landingJsonLd()
  },
  'consulta-cnpj': {
    title: 'Consultar CNPJ Grátis — Telefone, E-mail e Dados em Segundos | Lupa Insights',
    description:
      'Consulte qualquer empresa em segundos. Informações públicas de empresas brasileiras: telefone, e-mail, CNAE, situação cadastral, endereço, razão social e nome fantasia. Grátis para testar.',
    index: true,
    jsonLd: consultaCnpjJsonLd()
  },
  planos: {
    title: 'Planos e preços — Prospecção B2B | Lupa Insights',
    description:
      'Planos Free, Prospecção (R$ 19,90/mês) e Growth (R$ 49,90/mês). Consulta CNPJ em lote, enriquecimento de planilhas e exportação para CRM.',
    index: true,
    jsonLd: planosOffersJsonLd()
  },
  cadastro: {
    title: 'Criar conta grátis | Lupa Insights',
    description:
      'Cadastre-se grátis e consulte CNPJs em lote. Enriqueça planilhas com telefone, e-mail e dados cadastrais oficiais.',
    index: true
  },
  login: {
    title: 'Entrar | Lupa Insights',
    description: 'Acesse sua conta Lupa Insights para consultar e enriquecer listas de CNPJ.',
    index: true
  },
  app: {
    title: 'Painel | Lupa Insights',
    description: 'Painel de importação e enriquecimento de CNPJ.',
    index: false
  },
  historico: {
    title: 'Histórico | Lupa Insights',
    description: 'Histórico de consultas e importações.',
    index: false
  },
  conta: {
    title: 'Minha conta | Lupa Insights',
    description: 'Gerencie perfil, plano e cobrança.',
    index: false
  },
  consulta: {
    title: 'Consulta | Lupa Insights',
    description: 'Detalhe da consulta de CNPJ.',
    index: false
  },
  'planos/sucesso': {
    title: 'Pagamento | Lupa Insights',
    description: 'Resultado do pagamento.',
    index: false
  },
  'planos/pendente': {
    title: 'Pagamento pendente | Lupa Insights',
    description: 'Pagamento em processamento.',
    index: false
  },
  privacidade: {
    title: 'Política de Privacidade | Lupa Insights',
    description: 'Como o Lupa Insights trata seus dados pessoais em conformidade com a LGPD.',
    index: true
  },
  cookies: {
    title: 'Política de Cookies | Lupa Insights',
    description: 'Cookies e armazenamento local usados no Lupa Insights: essenciais, preferências e analíticos.',
    index: true
  },
  termos: {
    title: 'Termos de Uso | Lupa Insights',
    description: 'Termos e condições para utilização da plataforma Lupa Insights.',
    index: true
  }
};
