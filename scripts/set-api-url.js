const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || 'http://localhost:8080';
const target = path.join(__dirname, '../src/environments/environment.prod.ts');

const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl.replace(/'/g, "\\'")}'
};
`;

fs.writeFileSync(target, content, 'utf8');
console.log('environment.prod.ts gerado com apiUrl:', apiUrl);
