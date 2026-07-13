import { CNPJ_FRIENDLY_LABELS } from './cnpj-friendly-labels';
import { formatarDataAberturaExibicao } from './cnpj-insight-engine';

export interface CnpjResultField {
  label: string;
  valor: string;
  grupo?: 'identificacao' | 'contato' | 'localizacao' | 'atividade';
}

export interface CnpjResultLike {
  razaoSocial?: string;
  nomeFantasia?: string;
  situacaoCadastral?: string;
  naturezaJuridica?: string;
  dataAbertura?: string;
  capitalSocial?: string;
  porte?: string;
  telefone1?: string;
  telefone2?: string;
  email?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  uf?: string;
  cep?: string;
  cnaePrincipal?: string;
}

function valorOuTraco(valor?: string): string {
  return valor && valor.trim() ? valor.trim() : '—';
}

export function buildCnpjResultFields(r: CnpjResultLike): CnpjResultField[] {
  const telefones = [r.telefone1, r.telefone2].filter((t) => t && t.trim()).join(' · ');
  const endereco = [
    [r.logradouro, r.numero].filter(Boolean).join(', '),
    r.complemento,
    r.bairro,
    [r.cidade, r.uf].filter(Boolean).join('/'),
    r.cep
  ]
    .filter((parte) => parte && parte.trim())
    .join(' — ');

  return [
    { label: CNPJ_FRIENDLY_LABELS.razaoSocial, valor: valorOuTraco(r.razaoSocial), grupo: 'identificacao' },
    { label: CNPJ_FRIENDLY_LABELS.nomeFantasia, valor: valorOuTraco(r.nomeFantasia), grupo: 'identificacao' },
    { label: CNPJ_FRIENDLY_LABELS.situacaoCadastral, valor: valorOuTraco(r.situacaoCadastral), grupo: 'identificacao' },
    { label: CNPJ_FRIENDLY_LABELS.naturezaJuridica, valor: valorOuTraco(r.naturezaJuridica), grupo: 'identificacao' },
    { label: CNPJ_FRIENDLY_LABELS.dataAbertura, valor: formatarDataAberturaExibicao(r.dataAbertura), grupo: 'identificacao' },
    { label: CNPJ_FRIENDLY_LABELS.capitalSocial, valor: valorOuTraco(r.capitalSocial), grupo: 'identificacao' },
    { label: CNPJ_FRIENDLY_LABELS.porte, valor: valorOuTraco(r.porte), grupo: 'identificacao' },
    { label: CNPJ_FRIENDLY_LABELS.telefones, valor: telefones || '—', grupo: 'contato' },
    { label: CNPJ_FRIENDLY_LABELS.email, valor: valorOuTraco(r.email), grupo: 'contato' },
    { label: CNPJ_FRIENDLY_LABELS.endereco, valor: endereco || '—', grupo: 'localizacao' },
    { label: CNPJ_FRIENDLY_LABELS.cnaePrincipal, valor: valorOuTraco(r.cnaePrincipal), grupo: 'atividade' }
  ];
}

export function buildCnpjResultGroups(r: CnpjResultLike): { titulo: string; campos: CnpjResultField[] }[] {
  const fields = buildCnpjResultFields(r);
  const grupos: { titulo: string; key: CnpjResultField['grupo'] }[] = [
    { titulo: 'Identificação', key: 'identificacao' },
    { titulo: 'Contato', key: 'contato' },
    { titulo: 'Localização', key: 'localizacao' },
    { titulo: 'Atividade', key: 'atividade' }
  ];

  return grupos
    .map((g) => ({
      titulo: g.titulo,
      campos: fields.filter((f) => f.grupo === g.key && f.valor !== '—')
    }))
    .filter((g) => g.campos.length > 0);
}
