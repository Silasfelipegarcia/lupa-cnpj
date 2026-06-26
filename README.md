# Lupa Insights — Frontend

Interface web Angular 19 para consultar e enriquecer listas de CNPJs.

API em [lupa-insights-api](https://github.com/Silasfelipegarcia/lupa-insights-api) · Documentação completa em [docs/DOCUMENTACAO.md](../docs/DOCUMENTACAO.md).

**Produção:** https://lupa-insights.vercel.app

## Funcionalidades

- Cadastro (`/cadastro`) e login (`/login`) com JWT
- Upload de CSV/Excel na home (`/`)
- Acompanhamento em tempo real (`/consulta/:jobId`) com polling a cada 3 s
- Histórico de consultas (`/historico`) com reabertura
- Cancelamento de consulta em andamento (home, detalhe e histórico)
- Retomada automática após login se houver job ativo
- Download do CSV enriquecido e modelo Excel

## Rotas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/login` | visitante | Login |
| `/cadastro` | visitante | Cadastro |
| `/` | autenticado | Upload e banner de consulta ativa |
| `/consulta/:jobId` | autenticado | Detalhe com progresso |
| `/historico` | autenticado | Lista de consultas |
| `/historico/:jobId` | autenticado | Detalhe do histórico |

## Executar localmente

```bash
npm install
npm start              # API local (localhost:8080)
npm run start:api-prod # API Railway em produção
```

Acesse `http://localhost:4200`. A API deve estar em `http://localhost:8080` (`src/environments/environment.ts`).

## Deploy na Vercel

1. Importe o repositório `lupa-insights` em [vercel.com](https://vercel.com)
2. **Não** defina `API_URL` — o padrão `/api` usa o proxy para o Railway
3. Deploy automático a cada push em `main`

### Proxy (`vercel.json`)

```
/api/:path*  →  https://lupa-cnpj-api-production.up.railway.app/:path*
```

Isso evita CORS: o browser chama a mesma origem (`lupa-insights.vercel.app/api/...`).

## Variáveis de ambiente

| Variável | Onde | Descrição |
|----------|------|-----------|
| `API_URL` | Vercel (opcional) | URL base da API; padrão `/api` |

## Limites exibidos na UI

Configurados em `src/environments/environment*.ts`:

| Limite | Valor |
|--------|-------|
| Tamanho do arquivo | 5 MB |
| Linhas por arquivo | 200 (UI) / 900 (API) |
| Intervalo de polling | 3 s |

## Estrutura relevante

```
src/app/
├── components/
│   ├── cnpj-import/       # Home — upload
│   ├── consulta-detalhe/  # Progresso e cancelamento
│   ├── historico/         # Lista de consultas
│   ├── login/
│   └── register/
├── services/
│   ├── auth.service.ts
│   ├── auth-storage.ts
│   └── cnpj-import.service.ts
├── guards/                # authGuard, guestGuard
└── interceptors/          # JWT no header Authorization
```
