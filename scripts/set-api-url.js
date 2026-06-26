const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || '/api';
const siteUrl = (process.env.SITE_URL || 'https://www.lupacnpjs.com.br').replace(/'/g, "\\'");
const gaMeasurementId = (process.env.GA_MEASUREMENT_ID || 'G-D0DYGXTE04').replace(/'/g, "\\'");
const target = path.join(__dirname, '../src/environments/environment.prod.ts');

const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl.replace(/'/g, "\\'")}',
  siteUrl: '${siteUrl}',
  gaMeasurementId: '${gaMeasurementId}',
  limits: {
    maxFileSizeMb: 5,
    maxRowsPerFile: 200,
    statusPollIntervalMs: 3000
  }
};
`;

fs.writeFileSync(target, content, 'utf8');
console.log('environment.prod.ts gerado com apiUrl:', apiUrl, 'siteUrl:', siteUrl, 'ga:', gaMeasurementId);
