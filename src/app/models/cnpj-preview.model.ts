export interface CnpjPreviewQuota {
  consultasUsadas: number;
  consultasLimite: number;
  consultasRestantes: number;
  limiteAtingido: boolean;
}

export interface CnpjPreviewResult extends CnpjPreviewQuota {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  situacaoCadastral?: string;
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
  cadastroLimiteCnpjDia?: number;
  cadastroLimitePlanilha?: number;
  cadastroLimiteLoteDia?: number;
}

export interface CnpjPreviewCampo {
  label: string;
  valor: string;
}
