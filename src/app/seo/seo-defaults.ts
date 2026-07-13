import { RouteSeoConfig } from '../models/seo.model';
import { landingJsonLd, planosOffersJsonLd, consultaCnpjJsonLd } from './structured-data';

export const DEFAULT_SEO: RouteSeoConfig = {
  title: 'Consultar CNPJ — Dados e insights de empresas | Lupa Insights',
  description:
    'Pesquise qualquer CNPJ e encontre dados públicos, insights inteligentes, contatos e localização de empresas brasileiras em uma única plataforma.',
  index: true
};

export const ROUTE_SEO: Record<string, RouteSeoConfig> = {
  '': {
    title: 'Lupa Insights — Descubra tudo sobre qualquer empresa brasileira',
    description:
      'Consulte CNPJ gratuitamente e obtenha dados oficiais com insights inteligentes. Mais de 60 milhões de empresas brasileiras pesquisáveis.',
    index: true,
    jsonLd: landingJsonLd()
  },
  'consulta-cnpj': {
    title: 'Consultar CNPJ Grátis — 7 dias de Prospecção ao criar conta | Lupa Insights',
    description:
      '1 consulta grátis agora. Crie conta e ganhe 7 dias de Prospecção sem cartão — planilhas em lote, Excel e mais consultas por dia.',
    index: true,
    jsonLd: consultaCnpjJsonLd()
  },
  planos: {
    title: 'Planos e preços | Lupa Insights',
    description:
      'Planos para pesquisar empresas em volume. Trial 7 dias grátis, Prospecção (R$ 9,90/mês) e Growth (R$ 29,90/mês). Consulte CNPJs em lote e exporte em Excel.',
    index: true,
    jsonLd: planosOffersJsonLd()
  },
  cadastro: {
    title: 'Criar conta — 7 dias de Prospecção grátis | Lupa Insights',
    description:
      'Crie sua conta grátis e comece 7 dias de Prospecção ao confirmar o e-mail. Sem cartão — importe planilhas, exporte Excel e consulte mais CNPJs.',
    index: true
  },
  login: {
    title: 'Entrar | Lupa Insights',
    description: 'Acesse sua conta Lupa Insights para consultar e enriquecer listas de CNPJ.',
    index: true
  },
  'esqueci-senha': {
    title: 'Esqueci minha senha | Lupa Insights',
    description: 'Solicite um link por e-mail para redefinir a senha da sua conta Lupa Insights.',
    index: false
  },
  'redefinir-senha': {
    title: 'Redefinir senha | Lupa Insights',
    description: 'Defina uma nova senha para sua conta Lupa Insights.',
    index: false
  },
  'cadastro-pendente': {
    title: 'Confirme seu e-mail — trial de 7 dias | Lupa Insights',
    description: 'Confirme seu e-mail para ativar 7 dias de Prospecção grátis na Lupa Insights.',
    index: false
  },
  'verificar-email': {
    title: 'Confirmar e-mail | Lupa Insights',
    description: 'Confirmação de e-mail da conta Lupa Insights.',
    index: false
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
