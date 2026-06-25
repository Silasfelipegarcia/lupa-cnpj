#!/usr/bin/env node
const major = Number(process.versions.node.split('.')[0]);
if (major !== 22) {
  console.error(
    `\n⚠️  Node ${process.version} detectado. Este projeto usa Node 22 (.nvmrc).\n` +
      '   Rode:  nvm use\n' +
      '   Depois: npm run start:api-prod\n'
  );
  process.exit(1);
}
