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
    host: process.env.VUE_APP_FRONTEND_HOST,
    protocol: process.env.VUE_APP_FRONTEND_PROTOCOL,
  },
  backendUrl: process.env.VUE_APP_BACKEND_URL,
  websocketsUrl: process.env.VUE_APP_WEBSOCKETS_URL,
  tenantMode,
  isPlanEnabled,
  gitHubInstallationUrl:
    process.env.VUE_APP_GITHUB_INSTALLATION_URL,
  discordInstallationUrl:
    process.env.VUE_APP_DISCORD_INSTALLATION_URL,
  cubejsUrl: process.env.VUE_APP_CUBEJS_URL,
  conversationPublicUrl:
    process.env.VUE_APP_CONVERSATIONS_PUBLIC_URL,
  edition: process.env.VUE_APP_EDITION,
  communityPremium: process.env.VUE_APP_COMMUNITY_PREMIUM,
  env: process.env.VUE_APP_ENV,
  hotjarKey: process.env.VUE_APP_HOTJAR_KEY,
  nangoUrl: process.env.VUE_APP_NANGO_URL,
  unleash: {
    apiKey: process.env.VUE_APP_UNLEASH_API_KEY,
    url: process.env.VUE_APP_UNLEASH_URL,
  },
  formbricks: {
    url: process.env.VUE_APP_FORMBRICKS_URL,
    environmentId: process.env.VUE_APP_FORMBRICKS_ENVIRONMENT_ID,
  },
  stripe: {
    publishableKey:
      process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY || '',
    growthPlanPaymentLink:
      process.env.VUE_APP_STRIPE_GROWTH_PLAN_PAYMENT_LINK
      || '',
    eagleEyePlanPaymentLink:
      process.env
        .VUE_APP_STRIPE_EAGLE_EYE_PLAN_PAYMENT_LINK || '',
    customerPortalLink:
      process.env.VUE_APP_STRIPE_CUSTOMER_PORTAL_LINK || '',
  },
  sampleTenant: {
    id: process.env.VUE_APP_SAMPLE_TENANT_ID,
    token: process.env.VUE_APP_SAMPLE_TENANT_TOKEN,
  },
  isGitEnabled: process.env.VUE_APP_IS_GIT_ENABLED,
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
  },
  sampleTenant: {
    id: 'CROWD_VUE_APP_SAMPLE_TENANT_ID',
    token: 'CROWD_VUE_APP_SAMPLE_TENANT_TOKEN',
  },
  isGitEnabled: 'CROWD_VUE_APP_IS_GIT_ENABLED',
};

const config = defaultConfig.backendUrl
  ? defaultConfig
  : composedConfig;

config.isCommunityVersion = config.edition === 'community';
config.hasPremiumModules = !config.isCommunityVersion
  || config.communityPremium === 'true';
config.isGitIntegrationEnabled = config.isGitEnabled === 'true';

export default config;
