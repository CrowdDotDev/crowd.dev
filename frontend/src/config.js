/**
 * Tenant Mode
 * multi: Allow new users to create new tenants.
 * multi-with-subdomain: Same as multi, but enable access to the tenant via subdomain.
 * single: One tenant, the first user to register will be the admin.
 */
const tenantMode = 'multi'

/**
 * Plan payments configuration.
 */
const isPlanEnabled = true

const defaultConfig = {
  frontendUrl: {
    host: process.env.VUE_APP_FRONTEND_HOST,
    protocol: process.env.VUE_APP_FRONTEND_PROTOCOL
  },
  backendUrl: process.env.VUE_APP_BACKEND_URL,
  tenantMode,
  isPlanEnabled,
  stripePublishableKey:
    process.env.VUE_APP_STRIPE_PUBLISHABLE_KEY || '',
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
  pizzlyUrl: process.env.VUE_APP_PIZZLY_URL,
  pizzlyPublishableKey: process.env.VUE_APP_PIZZLY_PUBLISHABLE_KEY,
  posthogKey: process.env.VUE_APP_POSTHOG_API_KEY,
  pizzlyUrl: process.env.VUE_APP_PIZZLY_URL
}

const composedConfig = {
  frontendUrl: {
    host: 'CROWD_VUE_APP_FRONTEND_HOST',
    protocol: 'CROWD_VUE_APP_FRONTEND_PROTOCOL'
  },
  backendUrl: 'CROWD_VUE_APP_BACKEND_URL',
  tenantMode,
  isPlanEnabled,
  stripePublishableKey:
    'CROWD_VUE_APP_STRIPE_PUBLISHABLE_KEY' || '',
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
  pizzlyUrl: 'CROWD_VUE_APP_PIZZLY_URL',
  pizzlyPublishableKey: 'CROWD_VUE_APP_PIZZLY_PUBLISHABLE_KEY',
  posthogKey: 'CROWD_VUE_APP_POSTHOG_API_KEY',
  pizzlyUrl: 'CROWD_VUE_APP_PIZZLY_URL'
}

const config = defaultConfig.backendUrl
  ? defaultConfig
  : composedConfig

config.isCommunityVersion = config.edition === 'community'
config.hasPremiumModules =
  !config.isCommunityVersion ||
  config.communityPremium === 'true'

export default config
