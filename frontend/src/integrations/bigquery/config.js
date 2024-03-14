import config from '@/config';

export default {
  enabled: config.isBigQueryIntegrationEnabled,
  hideAsIntegration: !config.isBigQueryIntegrationEnabled,
  name: 'BigQuery',
  description: 'Create a 2-way sync with your BigQuery data warehouse.',
  image:
      '/images/integrations/bigquery.svg',
  enterprise: true,
};
