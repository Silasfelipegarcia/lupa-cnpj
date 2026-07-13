import {
  buildFindings,
  buildInsights,
  buildSmartSummary,
  CnpjInsightInput
} from './cnpj-insight-engine';

const baseAtiva: CnpjInsightInput = {
  razaoSocial: 'Alpha Comércio LTDA',
  situacaoCadastral: 'Ativa',
  dataAbertura: '2018-03-15',
  cidade: 'São Paulo',
  uf: 'SP',
  porte: 'Microempresa',
  cnaePrincipal: '47.11-3/01 - Comércio varejista de mercadorias em geral',
  capitalSocial: 'R$ 250.000,00',
  quantidadeSocios: 2,
  naturezaJuridica: 'Sociedade Empresária Limitada',
  logradouro: 'Rua das Flores',
  numero: '100',
  telefone1: '(11) 99999-0000'
};

describe('cnpj-insight-engine', () => {
  describe('buildSmartSummary', () => {
    it('monta resumo com dados completos', () => {
      const summary = buildSmartSummary(baseAtiva);
      expect(summary).toContain('2018');
      expect(summary).toContain('São Paulo');
      expect(summary).toContain('Microempresa');
      expect(summary).toContain('R$ 250.000,00');
    });

    it('não inventa dados ausentes', () => {
      const summary = buildSmartSummary({ razaoSocial: 'Empresa X' });
      expect(summary).toContain('Empresa X');
      expect(summary).not.toContain('undefined');
      expect(summary).not.toContain('R$');
    });
  });

  describe('buildFindings', () => {
    it('lista apenas itens verdadeiros', () => {
      const findings = buildFindings(baseAtiva);
      expect(findings.map((f) => f.text)).toContain('Empresa ativa');
      expect(findings.map((f) => f.text)).toContain('Sócios encontrados');
      expect(findings.map((f) => f.text)).toContain('Dados oficiais disponíveis');
    });

    it('não inclui sócios quando quantidade é zero', () => {
      const findings = buildFindings({ ...baseAtiva, quantidadeSocios: 0 });
      expect(findings.map((f) => f.text)).not.toContain('Sócios encontrados');
    });
  });

  describe('buildInsights', () => {
    it('gera insight de histórico consolidado para empresa com mais de 10 anos', () => {
      const insights = buildInsights({ ...baseAtiva, dataAbertura: '2010-01-01' });
      expect(insights.some((i) => i.text.includes('histórico consolidado'))).toBeTrue();
    });

    it('gera insight de MEI', () => {
      const insights = buildInsights({ ...baseAtiva, mei: 'Sim', porte: undefined });
      expect(insights.some((i) => i.text.includes('Microempreendedor Individual'))).toBeTrue();
    });

    it('gera insight de múltiplos sócios', () => {
      const insights = buildInsights(baseAtiva);
      expect(insights.some((i) => i.text.includes('múltiplos sócios'))).toBeTrue();
    });

    it('gera insight de um sócio', () => {
      const insights = buildInsights({ ...baseAtiva, quantidadeSocios: 1 });
      expect(insights.some((i) => i.text.includes('sócio cadastrado'))).toBeTrue();
    });

    it('gera insight de LTDA', () => {
      const insights = buildInsights(baseAtiva);
      expect(insights.some((i) => i.text.includes('sociedade limitada'))).toBeTrue();
    });

    it('não gera insights falsos sem dados', () => {
      const insights = buildInsights({});
      expect(insights.length).toBe(0);
    });
  });
});
