export interface ImportJobPersistido {
  jobId: string;
  arquivo: string;
}

const STORAGE_KEY = 'cnpj-import-job-ativo';

export class ImportJobStorage {

  static salvar(job: ImportJobPersistido): void {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(job));
  }

  static recuperar(): ImportJobPersistido | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as ImportJobPersistido;
    } catch {
      return null;
    }
  }

  static limpar(): void {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}
