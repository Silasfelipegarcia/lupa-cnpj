import { environment } from '../../environments/environment';

/** Verifica se a requisição HTTP aponta para a API (URL relativa ou absoluta). */
export function isApiUrl(url: string): boolean {
  const apiUrl = environment.apiUrl;
  if (!apiUrl) {
    return false;
  }
  if (url.startsWith(apiUrl)) {
    return true;
  }
  if (apiUrl.startsWith('/')) {
    return url.includes(apiUrl);
  }
  return false;
}
