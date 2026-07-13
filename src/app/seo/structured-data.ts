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
    description: 'Plataforma simples para consultar CNPJ e pesquisar dados públicos de empresas brasileiras.'
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Lupa Insights',
    url: SITE,
    description: 'Pesquise empresas por CNPJ — dados públicos, contatos e CNAEs em segundos.',
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
    description: 'Consulte CNPJ e encontre dados públicos, insights, contatos, CNAEs e localização de empresas brasileiras.',
    offers: [
      {
        '@type': 'Offer',
        name: 'Trial 7 dias',
        price: '0',
        priceCurrency: 'BRL',
        description: 'Prospecção completa por 7 dias ao criar conta — sem cartão para começar'
      },
      {
        '@type': 'Offer',
        name: 'Prospecção',
        price: '9.90',
        priceCurrency: 'BRL',
        description: '10 planilhas/dia, até 100 empresas por planilha'
      },
      {
        '@type': 'Offer',
        name: 'Growth',
        price: '29.90',
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
      'Importe uma planilha CSV ou Excel com os CNPJs. O Lupa consulta cada empresa e organiza os dados para você acompanhar em tempo real.'
  },
  {
    question: 'Quais informações posso encontrar?',
    answer:
      'Razão social, nome fantasia, status cadastral, sócios, telefones, e-mail, endereço, atividade principal e insights automáticos com base em dados oficiais.'
  },
  {
    question: 'Posso testar grátis?',
    answer:
      'Sim. Na página inicial você pode pesquisar 1 CNPJ completo sem cadastro. Ao criar conta e confirmar o e-mail, ganha 7 dias grátis para consultar empresas em lote.'
  },
  {
    question: 'Qual a diferença entre os planos?',
    answer:
      'Prospecção: 7 dias grátis ao criar conta, depois R$ 9,90/mês (plano anual) — até 100 empresas por planilha e exportação Excel. Growth (R$ 29,90/mês): até 500 empresas por planilha e filtros avançados.'
  },
  {
    question: 'Para quem o Lupa é indicado?',
    answer:
      'Para qualquer pessoa que precise pesquisar empresas: vendedores, contadores, consultores, advogados, empreendedores, analistas e quem quiser economizar tempo nas consultas.'
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
        price: '9.90',
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
        price: '29.90',
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
      'Não para a primeira consulta. Você pode consultar 1 CNPJ completo sem cadastro. Ao criar conta, ganha 7 dias de Prospecção grátis para importar planilhas e exportar em Excel.'
  },
  {
    question: 'É gratuito?',
    answer:
      'Sim para começar. A consulta avulsa é gratuita (1 por dispositivo). Ao criar conta, você ganha 7 dias de Prospecção grátis com planilhas em lote e exportação Excel.'
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
