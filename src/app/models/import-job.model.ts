export type ImportJobStatus = 'NA_FILA' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO' | 'CANCELADO';

export interface CnpjResultadoItem {
  razaoSocialInformada: string;
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacaoCadastral: string;
  telefone1: string;
  telefone2: string;
  email: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  cnaePrincipal: string;
  observacao: string;
  statusConsulta: string;
  erro: string;
}

export interface ImportJobResponse {
  jobId: string;
  status: ImportJobStatus;
  arquivo: string;
  total: number;
  processados: number;
  sucesso: number;
  erros: number;
  percentual: number;
  posicaoFila: number;
  mensagem: string;
  resultados: CnpjResultadoItem[];
  createdAt?: string;
  completedAt?: string;
}

export interface ImportJobSummary {
  jobId: string;
  status: ImportJobStatus;
  arquivo: string;
  total: number;
  processados: number;
  sucesso: number;
  erros: number;
  percentual: number;
  mensagem: string;
  createdAt?: string;
  completedAt?: string;
}
