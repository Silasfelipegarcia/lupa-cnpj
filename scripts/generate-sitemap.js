const fs = require('fs');
const path = require('path');

const siteUrl = (process.env.SITE_URL || 'https://www.lupacnpjs.com.br').replace(/\/$/, '');
const today = new Date().toISOString().slice(0, 10);

const routes = [
  { loc: '/', changefreq: 'weekly', priority: '1.0' },
  { loc: '/planos', changefreq: 'weekly', priority: '0.9' },
  { loc: '/cadastro', changefreq: 'monthly', priority: '0.8' },
  { loc: '/login', changefreq: 'monthly', priority: '0.5' }
];

const urls = routes.map((route) => `  <url>
    <loc>${siteUrl}${route.loc === '/' ? '/' : route.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const target = path.join(__dirname, '../public/sitemap.xml');
fs.writeFileSync(target, xml, 'utf8');
console.log('sitemap.xml gerado para', siteUrl);
