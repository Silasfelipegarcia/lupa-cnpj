const fs = require('fs');
const path = require('path');

// Em produção na Vercel usamos /api (proxy no vercel.json → Railway).
// Para build local apontando direto na API, defina API_URL.
const apiUrl = process.env.API_URL || '/api';
const target = path.join(__dirname, '../src/environments/environment.prod.ts');

const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl.replace(/'/g, "\\'")}',
  limits: {
    maxFileSizeMb: 5,
    maxRowsPerFile: 200,
    statusPollIntervalMs: 3000
  }
};
`;

fs.writeFileSync(target, content, 'utf8');
console.log('environment.prod.ts gerado com apiUrl:', apiUrl);
