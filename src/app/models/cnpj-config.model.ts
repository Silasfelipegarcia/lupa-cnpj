export interface CnpjConfig {
  pesquisaRazaoSocialHabilitada: boolean;
  exportExcel: boolean;
  filtroSomenteAtivos: boolean;
  filtrosAvancados: boolean;
  dedupeHabilitado: boolean;
  trialDisponivel: boolean;
}

export interface ListaSalva {
  jobId: string;
  nomeLista: string;
  arquivo: string;
  total: number;
  createdAt?: string;
}

export interface DownloadFiltros {
  somenteAtivos?: boolean;
  uf?: string;
  cnae?: string;
  comTelefone?: boolean;
  comEmail?: boolean;
}
