export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  siteUrl: 'http://localhost:4200',
  gaMeasurementId: null as string | null,
  limits: {
    maxFileSizeMb: 5,
    statusPollIntervalMs: 3000
  }
};
