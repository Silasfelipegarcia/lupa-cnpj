export interface CnpjResultField {
  label: string;
  valor: string;
}

export interface CnpjResultLike {
  razaoSocial?: string;
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
}

export function buildCnpjResultFields(r: CnpjResultLike): CnpjResultField[] {
  const telefones = [r.telefone1, r.telefone2].filter((t) => t && t.trim()).join(' · ');
  const endereco = [
    [r.logradouro, r.numero].filter(Boolean).join(', '),
    r.complemento,
    r.bairro,
    [r.cidade, r.uf].filter(Boolean).join('/'),
    r.cep
  ].filter((parte) => parte && parte.trim()).join(' — ');

  return [
    { label: 'Razão social', valor: r.razaoSocial || '—' },
    { label: 'Nome fantasia', valor: r.nomeFantasia || '—' },
    { label: 'Situação cadastral', valor: r.situacaoCadastral || '—' },
    { label: 'Telefones', valor: telefones || '—' },
    { label: 'E-mail', valor: r.email || '—' },
    { label: 'Endereço', valor: endereco || '—' },
    { label: 'CNAE principal', valor: r.cnaePrincipal || '—' }
  ];
}
