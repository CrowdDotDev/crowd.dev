import config from '@/config';

export default {
  enabled: config.isSnowflakeIntegrationEnabled,
  hideAsIntegration: !config.isSnowflakeIntegrationEnabled,
  name: 'Snowflake',
  description: 'Create a 2-way sync with your Snowflake data warehouse.',
  image:
      '/images/integrations/snowflake.svg',
  enterprise: true,
};
