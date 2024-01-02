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
  isGitEnabled: 'CROWD_VUE_APP_IS_GIT_ENABLED',
  isGroupsioEnabled: 'CROWD_VUE_APP_IS_GROUPSIO_ENABLED',
  isTwitterEnabled: 'CROWD_VUE_APP_IS_TWITTER_ENABLED',
};

const config = defaultConfig.backendUrl
  ? defaultConfig
  : composedConfig;

config.isCommunityVersion = config.edition === 'community';
config.hasPremiumModules = !config.isCommunityVersion
  || config.communityPremium === 'true';
config.isGitIntegrationEnabled = config.isGitEnabled === 'true';
config.isGroupsioIntegrationEnabled = config.isGroupsioEnabled === 'true';
config.isTwitterIntegrationEnabled = config.isTwitterEnabled === 'true';

export default config;
