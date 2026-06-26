import { FaqItem } from '../../seo/structured-data';

export interface AdLandingStep {
  num: string;
  title: string;
  text: string;
}

export interface AdLandingCard {
  title: string;
  text: string;
}

export interface AdLandingExampleRow {
  label: string;
  value: string;
  highlight?: boolean;
}

export interface AdLandingConfig {
  slug: string;
  headline: string;
  subheadline: string;
  benefits: string[];
  trustIndicators: { icon: string; text: string }[];
  inputPlaceholder: string;
  previewButton: string;
  previewButtonLoading: string;
  exampleTitle: string;
  exampleCnpj: string;
  exampleRows: AdLandingExampleRow[];
  steps: AdLandingStep[];
  whyCards: AdLandingCard[];
  comingSoonTitle: string;
  comingSoonNote: string;
  comingSoonItems: { icon: string; text: string }[];
  faq: FaqItem[];
  signupRef: string;
}

export const AD_LANDING_CONFIGS: Record<string, AdLandingConfig> = {
  'consulta-cnpj': {
    slug: 'consulta-cnpj',
    headline: 'Consulte qualquer empresa em segundos',
    subheadline:
      'Consulte gratuitamente informações públicas de empresas brasileiras. Encontre telefone, e-mail, CNAE, situação cadastral, endereço e muito mais em uma única pesquisa.',
    benefits: [
      'Telefone atualizado',
      'E-mail comercial',
      'CNAE principal',
      'Situação cadastral',
      'Endereço completo',
      'Razão social',
      'Nome fantasia'
    ],
    trustIndicators: [
      { icon: '⚡', text: 'Resultado em segundos' },
      { icon: '🔒', text: 'Dados públicos organizados' },
      { icon: '🇧🇷', text: 'Empresas de todo o Brasil' }
    ],
    inputPlaceholder: 'Digite o CNPJ',
    previewButton: 'Consultar Empresa',
    previewButtonLoading: 'Consultando...',
    exampleTitle: 'Veja um exemplo do resultado',
    exampleCnpj: '12.345.678/0001-90',
    exampleRows: [
      { label: 'Razão social', value: 'Alpha Tecnologia LTDA' },
      { label: 'Nome fantasia', value: 'Alpha Tech' },
      { label: 'Situação cadastral', value: 'ATIVA', highlight: true },
      { label: 'Telefones', value: '(11) 3456-7890 · (11) 98765-4321' },
      { label: 'E-mail', value: 'contato@alphatecnologia.com.br' },
      { label: 'Endereço', value: 'Av. Paulista, 1000 — Bela Vista — São Paulo/SP — 01310-100' },
      { label: 'CNAE principal', value: '62.01-5/01 — Desenvolvimento de programas de computador sob encomenda' }
    ],
    steps: [
      { num: '1', title: 'Digite o CNPJ', text: 'Informe os 14 dígitos da empresa.' },
      { num: '2', title: 'Consulte', text: 'Clique em Consultar Empresa e aguarde alguns segundos.' },
      { num: '3', title: 'Veja todas as informações organizadas', text: 'Telefone, e-mail, endereço e situação cadastral na mesma tela.' }
    ],
    whyCards: [
      { title: 'Tudo em um lugar', text: 'Telefone, e-mail, endereço e CNAE reunidos — sem abrir várias fontes.' },
      { title: 'Mais rápido que pesquisar manualmente', text: 'Resultado em segundos, não em minutos de navegação.' },
      { title: 'Interface limpa', text: 'Informações organizadas para você agir na hora.' },
      { title: 'Informações organizadas', text: 'Campos claros, prontos para copiar ou exportar.' },
      { title: 'Desenvolvido para quem trabalha com empresas', text: 'Feito para SDRs, reps e equipes comerciais B2B.' }
    ],
    comingSoonTitle: 'Em breve',
    comingSoonNote: 'Recursos em desenvolvimento — ainda não disponíveis na plataforma.',
    comingSoonItems: [
      { icon: '🤖', text: 'Insights por IA' },
      { icon: '📈', text: 'Empresas semelhantes' },
      { icon: '📍', text: 'Empresas da mesma região' },
      { icon: '🎯', text: 'Sugestões comerciais' },
      { icon: '📊', text: 'Inteligência empresarial' }
    ],
    faq: [
      {
        question: 'Os dados são públicos?',
        answer:
          'Sim. O Lupa Insights organiza informações de caráter público disponíveis em bases cadastrais oficiais de empresas brasileiras, como razão social, situação cadastral, endereço e CNAE.'
      },
      {
        question: 'Preciso criar conta?',
        answer:
          'Não para a primeira consulta. Você pode consultar 1 CNPJ completo sem cadastro. Para consultar mais empresas ou importar planilhas, crie uma conta grátis.'
      },
      {
        question: 'É gratuito?',
        answer:
          'Sim para começar. A consulta avulsa nesta página é gratuita (1 por dispositivo). Com conta Free, são 3 CNPJs por dia e 1 planilha de até 5 linhas.'
      },
      {
        question: 'Posso consultar qualquer empresa?',
        answer:
          'Qualquer empresa brasileira com CNPJ ativo na base cadastral consultada. Basta informar os 14 dígitos do CNPJ.'
      },
      {
        question: 'Como funciona?',
        answer:
          'Digite o CNPJ, clique em Consultar Empresa e receba telefone, e-mail, endereço, CNAE e situação cadastral organizados em segundos.'
      }
    ],
    signupRef: 'consulta-cnpj'
  }
};
