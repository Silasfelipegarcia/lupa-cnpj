import { isApiUrl } from './api-url.util';

describe('isApiUrl', () => {
  it('combina URL relativa da API', () => {
    expect(isApiUrl('/api/analytics/event')).toBeTrue();
  });

  it('combina URL absoluta que contém o prefixo /api', () => {
    expect(isApiUrl('https://www.lupacnpjs.com.br/api/analytics/event')).toBeTrue();
  });

  it('combina URL absoluta localhost', () => {
    expect(isApiUrl('http://localhost:8080/analytics/event')).toBeTrue();
  });

  it('ignora URLs externas', () => {
    expect(isApiUrl('https://example.com/api/foo')).toBeFalse();
  });
});
