# LupaCNPJ

Interface web para consultar e enriquecer listas de CNPJs em tempo real.

Parte do projeto **LupaCNPJ** — API em [lupa-cnpj-api](https://github.com/Silasfelipegarcia/lupa-cnpj-api).

## Funcionalidades

- Upload de CSV com colunas `cnpj` e/ou `razao_social`
- Acompanhamento em tempo real com barra de progresso
- Tabela com resultados parciais conforme cada CNPJ é consultado
- Download da planilha enriquecida em CSV
- Retoma consulta após refresh da página

## Executar localmente

```bash
npm install
npm start
```

Acesse `http://localhost:4200`.

Certifique-se de que a API está rodando em `http://localhost:8080` (veja o repo da API).

## Deploy na Vercel

1. Importe o repositório `lupa-cnpj` em [vercel.com](https://vercel.com)
2. **Não** defina `API_URL` na Vercel (o padrão `/api` usa o proxy para o Railway)
3. Deploy automático a cada push na branch `main`

O `vercel.json` encaminha `/api/*` → `https://lupa-cnpj-api-production.up.railway.app/*` (mesma origem, sem CORS).

## Variáveis de ambiente

| Variável | Descrição | Local |
|----------|-----------|-------|
| `API_URL` | URL base da API (opcional; padrão `/api` na Vercel) | Vercel |

Desenvolvimento: edite `src/environments/environment.ts` (`http://localhost:8080`).
