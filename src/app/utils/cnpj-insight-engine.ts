import { CnpjPreviewResult } from '../models/cnpj-preview.model';

export type CnpjInsightInput = Partial<
  Pick<
    CnpjPreviewResult,
    | 'razaoSocial'
    | 'nomeFantasia'
    | 'situacaoCadastral'
    | 'telefone1'
    | 'telefone2'
    | 'email'
    | 'logradouro'
    | 'numero'
    | 'cidade'
    | 'uf'
    | 'cnaePrincipal'
    | 'dataAbertura'
    | 'capitalSocial'
    | 'porte'
    | 'naturezaJuridica'
    | 'quantidadeSocios'
    | 'mei'
  >
>;

export interface CnpjFinding {
  text: string;
}

export interface CnpjInsight {
  text: string;
}

function hasText(value?: string | null): boolean {
  return !!value && value.trim().length > 0 && value.trim() !== '—';
}

function isAtiva(situacao?: string): boolean {
  return hasText(situacao) && situacao!.toLowerCase().includes('ativa');
}

function parseAnoAbertura(dataAbertura?: string): number | null {
  if (!hasText(dataAbertura)) {
    return null;
  }
  const match = dataAbertura!.match(/^(\d{4})/);
  return match ? parseInt(match[1], 10) : null;
}

function calcularIdadeAnos(dataAbertura?: string): number | null {
  const ano = parseAnoAbertura(dataAbertura);
  if (ano === null) {
    return null;
  }
  const idade = new Date().getFullYear() - ano;
  return idade >= 0 ? idade : null;
}

function formatarDataBr(dataAbertura?: string): string {
  if (!hasText(dataAbertura)) {
    return '';
  }
  const iso = dataAbertura!.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return `${iso[3]}/${iso[2]}/${iso[1]}`;
  }
  return dataAbertura!.trim();
}

function extrairSetorCnae(cnae?: string): string {
  if (!hasText(cnae)) {
    return '';
  }
  const parts = cnae!.split(' - ');
  if (parts.length > 1) {
    return parts.slice(1).join(' - ').trim();
  }
  const dash = cnae!.indexOf('—');
  if (dash > -1) {
    return cnae!.slice(dash + 1).trim();
  }
  return cnae!.trim();
}

function isMei(mei?: string): boolean {
  return hasText(mei) && mei!.toLowerCase().startsWith('s');
}

function isMicroempresa(porte?: string): boolean {
  return hasText(porte) && porte!.toLowerCase().includes('microempresa');
}

function isLtda(data: CnpjInsightInput): boolean {
  const natureza = data.naturezaJuridica?.toLowerCase() ?? '';
  const razao = data.razaoSocial?.toLowerCase() ?? '';
  return natureza.includes('limitada') || razao.includes('ltda');
}

function temContato(data: CnpjInsightInput): boolean {
  return (
    hasText(data.telefone1) ||
    hasText(data.telefone2) ||
    hasText(data.email)
  );
}

function temEndereco(data: CnpjInsightInput): boolean {
  return hasText(data.logradouro) && hasText(data.cidade);
}

export function buildSmartSummary(data: CnpjInsightInput): string {
  const partes: string[] = [];
  const ano = parseAnoAbertura(data.dataAbertura);
  const idade = calcularIdadeAnos(data.dataAbertura);

  if (isAtiva(data.situacaoCadastral) && ano !== null) {
    partes.push(`Empresa ativa desde ${ano}`);
  } else if (isAtiva(data.situacaoCadastral)) {
    partes.push('Empresa com status cadastral ativo');
  } else if (hasText(data.situacaoCadastral)) {
    partes.push(`Empresa com status ${data.situacaoCadastral!.toLowerCase()}`);
  }

  if (hasText(data.cidade) && hasText(data.uf)) {
    partes.push(`localizada em ${data.cidade}, ${data.uf}`);
  } else if (hasText(data.cidade)) {
    partes.push(`localizada em ${data.cidade}`);
  }

  if (isMei(data.mei)) {
    partes.push('enquadrada como Microempreendedor Individual');
  } else if (isMicroempresa(data.porte)) {
    partes.push('enquadrada como Microempresa');
  } else if (hasText(data.porte)) {
    partes.push(`enquadrada como ${data.porte}`);
  }

  const setor = extrairSetorCnae(data.cnaePrincipal);
  if (setor) {
    partes.push(`atuando no setor de ${setor.toLowerCase()}`);
  }

  if (hasText(data.capitalSocial)) {
    partes.push(`possui capital da empresa de ${data.capitalSocial}`);
  }

  if (isAtiva(data.situacaoCadastral)) {
    partes.push('com status cadastral regular');
  }

  if (partes.length === 0) {
    const nome = data.razaoSocial || data.nomeFantasia || 'Esta empresa';
    return `${nome} foi encontrada na base de dados oficiais brasileiras.`;
  }

  let texto = partes[0];
  if (partes.length === 2) {
    texto = `${partes[0]}, ${partes[1]}.`;
  } else if (partes.length > 2) {
    const meio = partes.slice(1, -1).join(', ');
    texto = `${partes[0]}, ${meio} e ${partes[partes.length - 1]}.`;
  } else {
    texto = `${texto}.`;
  }

  if (idade !== null && idade >= 3 && !texto.includes(String(ano))) {
    return texto;
  }

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function buildFindings(data: CnpjInsightInput): CnpjFinding[] {
  const findings: CnpjFinding[] = [];

  if (isAtiva(data.situacaoCadastral)) {
    findings.push({ text: 'Empresa ativa' });
  }
  if (temEndereco(data)) {
    findings.push({ text: 'Endereço localizado' });
  }
  if (hasText(data.cnaePrincipal)) {
    findings.push({ text: 'Atividade principal identificada' });
  }
  if ((data.quantidadeSocios ?? 0) > 0) {
    findings.push({ text: 'Sócios encontrados' });
  }
  if (hasText(data.capitalSocial)) {
    findings.push({ text: 'Capital da empresa informado' });
  }
  findings.push({ text: 'Dados oficiais disponíveis' });

  return findings;
}

export function buildInsights(data: CnpjInsightInput): CnpjInsight[] {
  const insights: CnpjInsight[] = [];
  const idade = calcularIdadeAnos(data.dataAbertura);

  if (isAtiva(data.situacaoCadastral)) {
    insights.push({ text: 'Empresa em situação cadastral regular.' });
  }

  if (idade !== null && idade > 10) {
    insights.push({ text: 'Empresa com histórico consolidado de atuação.' });
  } else if (idade !== null && idade >= 3) {
    insights.push({ text: `Empresa com ${idade} anos de atuação no mercado.` });
  }

  if (isMei(data.mei)) {
    insights.push({ text: 'Empresa enquadrada como Microempreendedor Individual.' });
  }

  if (isMicroempresa(data.porte)) {
    insights.push({ text: 'Empresa enquadrada como Microempresa.' });
  }

  if (isLtda(data)) {
    insights.push({ text: 'Empresa constituída como sociedade limitada.' });
  }

  const socios = data.quantidadeSocios ?? 0;
  if (socios > 1) {
    insights.push({ text: 'Empresa com quadro societário composto por múltiplos sócios.' });
  } else if (socios === 1) {
    insights.push({ text: 'Empresa com sócio cadastrado.' });
  }

  if (hasText(data.capitalSocial)) {
    insights.push({ text: `Capital social registrado de ${data.capitalSocial}.` });
  }

  if (hasText(data.cidade)) {
    insights.push({ text: `Empresa localizada em ${data.cidade}.` });
  }

  if (temContato(data)) {
    insights.push({ text: 'Dados de contato disponíveis.' });
  }

  return insights;
}

export function formatarDataAberturaExibicao(dataAbertura?: string): string {
  return formatarDataBr(dataAbertura) || '—';
}
