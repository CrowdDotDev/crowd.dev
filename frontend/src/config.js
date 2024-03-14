/**
 * Tenant Mode
 * multi: Allow new users to create new tenants.
 * multi-with-subdomain: Same as multi, but enable access to the tenant via subdomain.
 * single: One tenant, the first user to register will be the admin.
 */
const tenantMode = 'multi';

/**
 * Plan payments configuration.
 */
const isPlanEnabled = true;

const defaultConfig = {
  frontendUrl: {
    host: import.meta.env.VUE_APP_FRONTEND_HOST,
    protocol: import.meta.env.VUE_APP_FRONTEND_PROTOCOL,
  },
  backendUrl: import.meta.env.VUE_APP_BACKEND_URL,
  websocketsUrl: import.meta.env.VUE_APP_WEBSOCKETS_URL,
  tenantMode,
  isPlanEnabled,
  gitHubInstallationUrl:
    import.meta.env.VUE_APP_GITHUB_INSTALLATION_URL,
  discordInstallationUrl:
    import.meta.env.VUE_APP_DISCORD_INSTALLATION_URL,
  cubejsUrl: import.meta.env.VUE_APP_CUBEJS_URL,
  conversationPublicUrl:
    import.meta.env.VUE_APP_CONVERSATIONS_PUBLIC_URL,
  edition: import.meta.env.VUE_APP_EDITION,
  communityPremium: import.meta.env.VUE_APP_COMMUNITY_PREMIUM,
  env: import.meta.env.VUE_APP_ENV,
  hotjarKey: import.meta.env.VUE_APP_HOTJAR_KEY,
  nangoUrl: import.meta.env.VUE_APP_NANGO_URL,
  unleash: {
    apiKey: import.meta.env.VUE_APP_UNLEASH_API_KEY,
    url: import.meta.env.VUE_APP_UNLEASH_URL,
  },
  formbricks: {
    url: import.meta.env.VUE_APP_FORMBRICKS_URL,
    environmentId: import.meta.env.VUE_APP_FORMBRICKS_ENVIRONMENT_ID,
  },
  stripe: {
    publishableKey:
      import.meta.env.VUE_APP_STRIPE_PUBLISHABLE_KEY || '',
    growthPlanPaymentLink:
      import.meta.env.VUE_APP_STRIPE_GROWTH_PLAN_PAYMENT_LINK
      || '',
    eagleEyePlanPaymentLink:
      import.meta.env
        .VUE_APP_STRIPE_EAGLE_EYE_PLAN_PAYMENT_LINK || '',
    customerPortalLink:
      import.meta.env.VUE_APP_STRIPE_CUSTOMER_PORTAL_LINK || '',
    scaleMonthlyPaymentLink:
      import.meta.env.VUE_APP_STRIPE_SCALE_MONTHLY_PLAN_PAYMENT_LINK || '',
    scaleYearlyPaymentLink:
      import.meta.env.VUE_APP_STRIPE_SCALE_YEARLY_PLAN_PAYMENT_LINK || '',
    essentialMonthlyPaymentLink:
      import.meta.env.VUE_APP_STRIPE_ESSENTIAL_MONTHLY_PLAN_PAYMENT_LINK || '',
    essentialYearlyPaymentLink:
      import.meta.env.VUE_APP_STRIPE_ESSENTIAL_YEARLY_PLAN_PAYMENT_LINK || '',
  },
  sampleTenant: {
    id: import.meta.env.VUE_APP_SAMPLE_TENANT_ID,
    token: import.meta.env.VUE_APP_SAMPLE_TENANT_TOKEN,
  },
  isGitHubEnabled: import.meta.env.VUE_APP_IS_GITHUB_ENABLED,
  isHackerNewsEnabled: import.meta.env.VUE_APP_IS_HACKERNEWS_ENABLED,
  isDiscordEnabled: import.meta.env.VUE_APP_IS_DISCORD_ENABLED,
  isLinkedInEnabled: import.meta.env.VUE_APP_IS_LINKEDIN_ENABLED,
  isHubspotEnabled: import.meta.env.VUE_APP_IS_HUBSPOT_ENABLED,
  isSlackEnabled: import.meta.env.VUE_APP_IS_SLACK_ENABLED,
  isDevtoEnabled: import.meta.env.VUE_APP_IS_DEVTO_ENABLED,
  isRedditEnabled: import.meta.env.VUE_APP_IS_REDDIT_ENABLED,
  isStackoverflowEnabled: import.meta.env.VUE_APP_IS_STACKOVERFLOW_ENABLED,
  isDiscourseEnabled: import.meta.env.VUE_APP_IS_DISCOURSE_ENABLED,
  isZapierEnabled: import.meta.env.VUE_APP_IS_ZAPIER_ENABLED,
  isSalesforceEnabled: import.meta.env.VUE_APP_IS_SALESFORCE_ENABLED,
  isSegmentEnabled: import.meta.env.VUE_APP_IS_SEGMENT_ENABLED,
  isCensusEnabled: import.meta.env.VUE_APP_IS_CENSUS_ENABLED,
  isSnowflakeEnabled: import.meta.env.VUE_APP_IS_SNOWFLAKE_ENABLED,
  isBigQueryEnabled: import.meta.env.VUE_APP_IS_BIGQUERY_ENABLED,
  isN8nEnabled: import.meta.env.VUE_APP_IS_N8N_ENABLED,
  isGitEnabled: import.meta.env.VUE_APP_IS_GIT_ENABLED,
  isGroupsioEnabled: import.meta.env.VUE_APP_IS_GROUPSIO_ENABLED,
  isTwitterEnabled: import.meta.env.VUE_APP_IS_TWITTER_ENABLED,
};

const composedConfig = {
  frontendUrl: {
    host: 'CROWD_VUE_APP_FRONTEND_HOST',
    protocol: 'CROWD_VUE_APP_FRONTEND_PROTOCOL',
  },
  backendUrl: 'CROWD_VUE_APP_BACKEND_URL',
  websocketsUrl: 'CROWD_VUE_APP_WEBSOCKETS_URL',
  tenantMode,
  isPlanEnabled,
  gitHubInstallationUrl:
    'CROWD_VUE_APP_GITHUB_INSTALLATION_URL',
  discordInstallationUrl:
    'CROWD_VUE_APP_DISCORD_INSTALLATION_URL',
  cubejsUrl: 'CROWD_VUE_APP_CUBEJS_URL',
  conversationPublicUrl:
    'CROWD_VUE_APP_CONVERSATIONS_PUBLIC_URL',
  edition: 'CROWD_VUE_APP_EDITION',
  communityPremium: 'CROWD_VUE_APP_COMMUNITY_PREMIUM',
  env: 'CROWD_VUE_APP_ENV',
  hotjarKey: 'CROWD_VUE_APP_HOTJAR_KEY',
  nangoUrl: 'CROWD_VUE_APP_NANGO_URL',
  typeformId: 'CROWD_VUE_APP_TYPEFORM_ID',
  typeformTitle: 'CROWD_VUE_APP_TYPEFORM_TITLE',
  unleash: {
    apiKey: 'CROWD_VUE_APP_UNLEASH_API_KEY',
    url: 'CROWD_VUE_APP_UNLEASH_URL',
  },
  formbricks: {
    url: 'CROWD_VUE_APP_FORMBRICKS_URL',
    environmentId: 'CROWD_VUE_APP_FORMBRICKS_ENVIRONMENT_ID',
  },
  stripe: {
    publishableKey:
      'CROWD_VUE_APP_STRIPE_PUBLISHABLE_KEY' || '',
    growthPlanPaymentLink:
      'CROWD_VUE_APP_STRIPE_GROWTH_PLAN_PAYMENT_LINK' || '',
    eagleEyePlanPaymentLink:
      'CROWD_VUE_APP_STRIPE_EAGLE_EYE_PLAN_PAYMENT_LINK'
      || '',
    customerPortalLink:
      'CROWD_VUE_APP_STRIPE_CUSTOMER_PORTAL_LINK' || '',
    scaleMonthlyPaymentLink:
      'CROWD_VUE_APP_STRIPE_SCALE_MONTHLY_PLAN_PAYMENT_LINK' || '',
    scaleYearlyPaymentLink:
      'CROWD_VUE_APP_STRIPE_SCALE_YEARLY_PLAN_PAYMENT_LINK' || '',
    essentialMonthlyPaymentLink:
      'CROWD_VUE_APP_STRIPE_ESSENTIAL_MONTHLY_PLAN_PAYMENT_LINK' || '',
    essentialYearlyPaymentLink:
      'CROWD_VUE_APP_STRIPE_ESSENTIAL_YEARLY_PLAN_PAYMENT_LINK' || '',
  },
  sampleTenant: {
    id: 'CROWD_VUE_APP_SAMPLE_TENANT_ID',
    token: 'CROWD_VUE_APP_SAMPLE_TENANT_TOKEN',
  },
  isGitHubEnabled: 'CROWD_VUE_APP_IS_GITHUB_ENABLED',
  isHackerNewsEnabled: 'CROWD_VUE_APP_IS_HACKERNEWS_ENABLED',
  isDiscordEnabled: 'CROWD_VUE_APP_IS_DISCORD_ENABLED',
  isLinkedInEnabled: 'CROWD_VUE_APP_IS_LINKEDIN_ENABLED',
  isHubspotEnabled: 'CROWD_VUE_APP_IS_HUBSPOT_ENABLED',
  isSlackEnabled: 'CROWD_VUE_APP_IS_SLACK_ENABLED',
  isDevtoEnabled: 'CROWD_VUE_APP_IS_DEVTO_ENABLED',
  isRedditEnabled: 'CROWD_VUE_APP_IS_REDDIT_ENABLED',
  isStackoverflowEnabled: 'CROWD_VUE_APP_IS_STACKOVERFLOW_ENABLED',
  isDiscourseEnabled: 'CROWD_VUE_APP_IS_DISCOURSE_ENABLED',
  isZapierEnabled: 'CROWD_VUE_APP_IS_ZAPIER_ENABLED',
  isSalesforceEnabled: 'CROWD_VUE_APP_IS_SALESFORCE_ENABLED',
  isSegmentEnabled: 'CROWD_VUE_APP_IS_SEGMENT_ENABLED',
  isCensusEnabled: 'CROWD_VUE_APP_IS_CENSUS_ENABLED',
  isSnowflakeEnabled: 'CROWD_VUE_APP_IS_SNOWFLAKE_ENABLED',
  isBigQueryEnabled: 'CROWD_VUE_APP_IS_BIGQUERY_ENABLED',
  isN8nEnabled: 'CROWD_VUE_APP_IS_N8N_ENABLED',
  isGitEnabled: 'CROWD_VUE_APP_IS_GIT_ENABLED',
  isGroupsioEnabled: 'CROWD_VUE_APP_IS_GROUPSIO_ENABLED',
  isTwitterEnabled: 'CROWD_VUE_APP_IS_TWITTER_ENABLED',
};

const config = defaultConfig.backendUrl
  ? defaultConfig
  : composedConfig;

config.isCommunityVersion = config.edition === 'community';
config.isEagleEyeEnabled = !config.isCommunityVersion || config.communityPremium === 'true';
config.hasPremiumModules = !config.isCommunityVersion
  || config.communityPremium === 'true';
config.isGitIntegrationEnabled = config.isGitEnabled === 'true';
config.isGroupsioIntegrationEnabled = config.isGroupsioEnabled === 'true';
config.isGitHubIntegrationEnabled = config.isGitHubEnabled === 'true';
config.isDiscordIntegrationEnabled = config.isDiscordEnabled === 'true';
config.isHackerNewsIntegrationEnabled = config.isHackerNewsEnabled === 'true';
config.isTwitterIntegrationEnabled = config.isTwitterEnabled === 'true';
config.isLinkedInIntegrationEnabled = config.isLinkedInEnabled === 'true';
config.isHubspotIntegrationEnabled = config.isHubspotEnabled === 'true';
config.isSlackIntegrationEnabled = config.isSlackEnabled === 'true';
config.isDevtoIntegrationEnabled = config.isDevtoEnabled === 'true';
config.isRedditIntegrationEnabled = config.isRedditEnabled === 'true';
config.isStackoverflowIntegrationEnabled = config.isStackoverflowEnabled === 'true';
config.isDiscourseIntegrationEnabled = config.isDiscourseEnabled === 'true';
config.isZapierIntegrationEnabled = config.isZapierEnabled === 'true';
config.isSalesforceIntegrationEnabled = config.isSalesforceEnabled === 'true';
config.isSegmentIntegrationEnabled = config.isSegmentEnabled === 'true';
config.isCensusIntegrationEnabled = config.isCensusEnabled === 'true';
config.isSnowflakeIntegrationEnabled = config.isSnowflakeEnabled === 'true';
config.isBigQueryIntegrationEnabled = config.isBigQueryEnabled === 'true';
config.isN8nIntegrationEnabled = config.isN8nEnabled === 'true';

export default config;
