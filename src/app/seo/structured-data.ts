import { environment } from '../../environments/environment';

const SITE = environment.siteUrl;

export function organizationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Lupa Insights',
    url: SITE,
    logo: `${SITE}/favicon.svg`,
    email: 'contato@lupainsights.com.br',
    description: 'Plataforma de consulta e enriquecimento de CNPJ em lote para prospecção B2B.'
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Lupa Insights',
    url: SITE,
    description: 'Consulta e enriquecimento de CNPJ em planilha para equipes comerciais.',
    inLanguage: 'pt-BR'
  };
}

export function softwareApplicationJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Lupa Insights',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: SITE,
    description: 'Enriqueça listas de CNPJ com dados cadastrais oficiais, telefone, e-mail e exportação Excel.',
    offers: [
      {
        '@type': 'Offer',
        name: 'Free',
        price: '0',
        priceCurrency: 'BRL',
        description: '3 CNPJs/dia, 1 planilha de até 5 linhas'
      },
      {
        '@type': 'Offer',
        name: 'Prospecção',
        price: '19.90',
        priceCurrency: 'BRL',
        description: '10 planilhas/dia, até 100 empresas por planilha'
      },
      {
        '@type': 'Offer',
        name: 'Growth',
        price: '49.90',
        priceCurrency: 'BRL',
        description: '50 planilhas/dia, até 500 empresas por planilha'
      }
    ]
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqPageJsonLd(items: FaqItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer
      }
    }))
  };
}

export const LANDING_FAQ: FaqItem[] = [
  {
    question: 'Como consultar vários CNPJs de uma vez?',
    answer:
      'Importe uma planilha CSV ou Excel com os CNPJs (ou razão social no plano Prospecção). O Lupa Insights enriquece cada linha com dados cadastrais oficiais e você acompanha o progresso em tempo real.'
  },
  {
    question: 'Quais dados da Receita Federal o Lupa Insights traz?',
    answer:
      'Razão social, nome fantasia, situação cadastral, telefones, e-mail, endereço completo, CNAE principal e mais — dados cadastrais oficiais para qualificar sua prospecção B2B.'
  },
  {
    question: 'Posso testar grátis?',
    answer:
      'Sim. Na página inicial você pode consultar 1 CNPJ completo sem cadastro. Com conta Free, são 3 consultas avulsas por dia e 1 planilha de até 5 linhas. O plano Prospecção oferece 7 dias grátis com cartão cadastrado.'
  },
  {
    question: 'Qual a diferença entre os planos?',
    answer:
      'Free: ideal para testar (3 CNPJs/dia, 1 planilha). Prospecção (R$ 19,90/mês): 10 planilhas/dia com até 100 empresas cada, Excel e filtros. Growth (R$ 49,90/mês): 50 planilhas/dia com até 500 empresas, dedupe e filtros avançados.'
  },
  {
    question: 'Serve para prospecção B2B e SDR?',
    answer:
      'Sim. O foco é transformar listas brutas em leads qualificados com telefone, e-mail e situação cadastral — prontos para exportar ao CRM e iniciar outreach.'
  }
];

export function planosOffersJsonLd(): Record<string, unknown>[] {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Lupa Insights Prospecção',
      description: '10 planilhas/dia, até 100 empresas por planilha, exportação Excel e filtros comerciais.',
      brand: { '@type': 'Brand', name: 'Lupa Insights' },
      offers: {
        '@type': 'Offer',
        price: '19.90',
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
        url: `${SITE}/planos`
      }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: 'Lupa Insights Growth',
      description: '50 planilhas/dia, até 500 empresas por planilha, dedupe e filtros avançados.',
      brand: { '@type': 'Brand', name: 'Lupa Insights' },
      offers: {
        '@type': 'Offer',
        price: '49.90',
        priceCurrency: 'BRL',
        availability: 'https://schema.org/InStock',
        url: `${SITE}/planos`
      }
    }
  ];
}

export function landingJsonLd(): Record<string, unknown>[] {
  return [
    organizationJsonLd(),
    websiteJsonLd(),
    softwareApplicationJsonLd(),
    faqPageJsonLd(LANDING_FAQ)
  ];
}

export const CONSULTA_CNPJ_FAQ: FaqItem[] = [
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
      'Sim para começar. A consulta avulsa é gratuita (1 por dispositivo). Com conta Free, são 3 CNPJs por dia e 1 planilha de até 5 linhas.'
  },
  {
    question: 'Posso consultar qualquer empresa?',
    answer:
      'Qualquer empresa brasileira com CNPJ na base cadastral consultada. Basta informar os 14 dígitos do CNPJ.'
  },
  {
    question: 'Como funciona?',
    answer:
      'Digite o CNPJ, clique em Consultar Empresa e receba telefone, e-mail, endereço, CNAE e situação cadastral organizados em segundos.'
  }
];

export function consultaCnpjJsonLd(): Record<string, unknown>[] {
  const pageUrl = `${SITE}/consulta-cnpj`;

  return [
    organizationJsonLd(),
    {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Lupa Insights — Consultar CNPJ',
      url: pageUrl,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      browserRequirements: 'Requires JavaScript',
      description:
        'Consulte CNPJ online e veja telefone, e-mail, CNAE, situação cadastral, endereço, razão social e nome fantasia em segundos.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BRL',
        description: '1 consulta CNPJ grátis sem cadastro'
      },
      provider: {
        '@type': 'Organization',
        name: 'Lupa Insights',
        url: SITE
      }
    },
    faqPageJsonLd(CONSULTA_CNPJ_FAQ)
  ];
}
