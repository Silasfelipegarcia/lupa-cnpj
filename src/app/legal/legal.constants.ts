/** Atualize nome e CPF do titular (controlador LGPD) antes do deploy em produção. */
export const LEGAL = {
  productName: 'Lupa Insights',
  siteUrl: 'https://www.lupacnpjs.com.br',
  controllerName: 'NOME DO TITULAR',
  controllerCpf: '000.000.000-00',
  contactEmail: 'contato@lupainsights.com.br',
  policyVersion: '1.0',
  policyEffectiveDate: '25 de junho de 2025'
} as const;

export const COOKIE_CONSENT_KEY = 'lupa_cookie_consent';
export const COOKIE_CONSENT_VERSION = 1;
