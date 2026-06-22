export interface CnpjPreviewQuota {
  consultasUsadas: number;
  consultasLimite: number;
  consultasRestantes: number;
  limiteAtingido: boolean;
}

export interface CnpjPreviewResult extends CnpjPreviewQuota {
  cnpj: string;
  razaoSocial: string;
  camposComLogin: string[];
}
