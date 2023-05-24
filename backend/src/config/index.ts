import config from 'config'
import {
  SQSConfiguration,
  S3Configuration,
  DbConfiguration,
  PlansConfiguration,
  TwitterConfiguration,
  ApiConfiguration,
  SlackConfiguration,
  GoogleConfiguration,
  DiscordConfiguration,
  ServiceType,
  SearchEngineConfiguration,
  SegmentConfiguration,
  GithubConfiguration,
  SendgridConfiguration,
  NetlifyConfiguration,
  TenantMode,
  CubeJSConfiguration,
  ComprehendConfiguration,
  ClearbitConfiguration,
  DevtoConfiguration,
  RedisConfiguration,
  NangoConfiguration,
  EnrichmentConfiguration,
  EagleEyeConfiguration,
  UnleashConfiguration,
  StackExchangeConfiguration,
  SlackAlertingConfiguration,
  SampleDataConfiguration,
  IntegrationProcessingConfiguration,
  SlackNotifierConfiguration,
  OrganizationEnrichmentConfiguration,
} from './configTypes'

// TODO-kube

export const KUBE_MODE: boolean = process.env.KUBE_MODE !== undefined

export const SERVICE: ServiceType = process.env.SERVICE as ServiceType

export const TENANT_MODE: TenantMode = process.env.TENANT_MODE as TenantMode

export const IS_TEST_ENV: boolean = process.env.NODE_ENV === 'test'

export const IS_DEV_ENV: boolean =
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === 'docker' ||
  process.env.NODE_ENV === undefined

export const IS_PROD_ENV: boolean = process.env.NODE_ENV === 'production'

export const IS_STAGING_ENV: boolean = process.env.NODE_ENV === 'staging'

export const LOG_LEVEL: string = process.env.LOG_LEVEL || 'info'

export const IS_CLOUD_ENV: boolean = IS_PROD_ENV || IS_STAGING_ENV

export const SQS_CONFIG: SQSConfiguration = config.get<SQSConfiguration>('sqs')

export const REDIS_CONFIG: RedisConfiguration = config.get<RedisConfiguration>('redis')

export const S3_CONFIG: S3Configuration = KUBE_MODE
  ? config.get<S3Configuration>('s3')
  : {
      microservicesAssetsBucket: process.env.MICROSERVICES_ASSETS_BUCKET,
      integrationsAssetsBucket: process.env.INTEGRATIONS_ASSETS_BUCKET,
      // can be left blank - aws.ts configuration gets it straight from env
      aws: {
        accessKeyId: '',
        accountId: '',
        region: '',
        secretAccessKey: '',
      },
    }

export const DB_CONFIG: DbConfiguration = KUBE_MODE
  ? config.get<DbConfiguration>('db')
  : {
      database: process.env.DATABASE_DATABASE,
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      dialect: process.env.DATABASE_DIALECT,
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      readHost: process.env.DATABASE_HOST_READ,
      writeHost: process.env.DATABASE_HOST_WRITE,
      logging: false,
      transactions: false,
    }

export const SEARCH_ENGINE_CONFIG: SearchEngineConfiguration = KUBE_MODE
  ? config.get<SearchEngineConfiguration>('searchEngine')
  : {
      host: process.env.SEARCH_ENGINE_HOST,
      apiKey: process.env.SEARCH_ENGINE_API_KEY,
    }

export const SEGMENT_CONFIG: SegmentConfiguration = KUBE_MODE
  ? config.get<SegmentConfiguration>('segment')
  : {
      writeKey: process.env.SEGMENT_WRITE_KEY,
    }

export const COMPREHEND_CONFIG: ComprehendConfiguration = KUBE_MODE
  ? config.get<ComprehendConfiguration>('comprehend')
  : {
      // can be left blank - aws.ts configuration gets it straight from env
      aws: {
        accessKeyId: '',
        accountId: '',
        region: '',
        secretAccessKey: '',
      },
    }

export const CLEARBIT_CONFIG: ClearbitConfiguration = KUBE_MODE
  ? config.get<ClearbitConfiguration>('clearbit')
  : {
      apiKey: process.env.CLEARBIT_API_KEY,
    }

export const API_CONFIG: ApiConfiguration = KUBE_MODE
  ? config.get<ApiConfiguration>('api')
  : {
      port: Number(process.env.BACKEND_PORT || 8080),
      edition: process.env.EDITION,
      documentation: !!process.env.API_DOCUMENTATION_ENABLED,
      url: process.env.BACKEND_URL,
      frontendUrl: process.env.FRONTEND_URL,
      frontendUrlWithSubdomain: process.env.FRONTEND_URL_WITH_SUBDOMAIN,
      jwtSecret: process.env.AUTH_JWT_SECRET,
      jwtExpiresIn: process.env.AUTH_JWT_EXPIRES_IN,
    }
export const PLANS_CONFIG: PlansConfiguration = KUBE_MODE
  ? config.get<PlansConfiguration>('plans')
  : {
      stripePricePremium: process.env.PLAN_STRIPE_PRICES_PREMIUM,
      stripePriceEnterprise: process.env.PLAN_STRIPE_PRICES_ENTERPRISE,
      stripeSecretKey: process.env.PLAN_STRIPE_SECRET_KEY,
      stripWebhookSigningSecret: process.env.PLAN_STRIPE_WEBHOOK_SIGNING_SECRET,
      stripeEagleEyePlanProductId: process.env.PLAN_STRIPE_EAGLE_EYE_PLAN_PRODUCT_ID,
      stripeGrowthPlanProductId: process.env.PLAN_STRIPE_GROWTH_PLAN_PRODUCT_ID,
    }

export const DEVTO_CONFIG: DevtoConfiguration = KUBE_MODE
  ? config.get<DevtoConfiguration>('devto')
  : {}

export const TWITTER_CONFIG: TwitterConfiguration = KUBE_MODE
  ? config.get<TwitterConfiguration>('twitter')
  : {
      clientId: process.env.AUTH_SOCIAL_TWITTER_CLIENT_ID,
      clientSecret: process.env.AUTH_SOCIAL_TWITTER_CLIENT_SECRET,
      maxRetrospectInSeconds: Number(process.env.TWITTER_MAX_RETROSPECT_IN_SECONDS || 7380),
      globalLimit: Number(process.env.TWITTER_GLOBAL_LIMIT || 10000),
      limitResetFrequencyDays: Number(process.env.TWITTER_LIMIT_RESET_FREQUENCY_DAYS),
    }

export const SLACK_CONFIG: SlackConfiguration = config.get<SlackConfiguration>('slack')

export const SLACK_NOTIFIER_CONFIG: SlackNotifierConfiguration =
  config.get<SlackNotifierConfiguration>('slackNotifier')

export const GOOGLE_CONFIG: GoogleConfiguration = KUBE_MODE
  ? config.get<GoogleConfiguration>('google')
  : {
      clientId: process.env.AUTH_SOCIAL_GOOGLE_CLIENT_ID,
      clientSecret: process.env.AUTH_SOCIAL_GOOGLE_CLIENT_SECRET,
      callbackUrl: process.env.AUTH_SOCIAL_GOOGLE_CALLBACK_URL,
    }

export const DISCORD_CONFIG: DiscordConfiguration = KUBE_MODE
  ? config.get<DiscordConfiguration>('discord')
  : {
      token: process.env.DISCORD_TOKEN,
      token2: process.env.DISCORD_TOKEN,
      maxRetrospectInSeconds: Number(process.env.DISCORD_MAX_RETROSPECT_IN_SECONDS || 3600),
      globalLimit: Number(process.env.DISCORD_GLOBAL_LIMIT || Infinity),
    }

export const GITHUB_CONFIG: GithubConfiguration = KUBE_MODE
  ? config.get<GithubConfiguration>('github')
  : {
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_PRIVATE_KEY,
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      webhookSecret: process.env.GITHUB_WEBHOOK_SECRET,
      isCommitDataEnabled: process.env.GITHUB_IS_COMMIT_DATA_ENABLED === 'true',
    }

export const SENDGRID_CONFIG: SendgridConfiguration = KUBE_MODE
  ? config.get<SendgridConfiguration>('sendgrid')
  : {
      key: process.env.SENDGRID_KEY,
      webhookSigningSecret: process.env.SENDGRID_WEBHOOK_SIGNING_SECRET,
      emailFrom: process.env.SENDGRID_EMAIL_FROM,
      nameFrom: process.env.SENDGRID_NAME_FROM,
      weeklyAnalyticsUnsubscribeGroupId: process.env.SENDGRID_WEEKLY_ANALYTICS_UNSUBSCRIBE_GROUP_ID,
      templateEmailAddressVerification: process.env.SENDGRID_TEMPLATE_EMAIL_ADDRESS_VERIFICATION,
      templateInvitation: process.env.SENDGRID_TEMPLATE_INVITATION,
      templatePasswordReset: process.env.SENDGRID_TEMPLATE_PASSWORD_RESET,
      templateWeeklyAnalytics: process.env.SENDGRID_TEMPLATE_WEEKLY_ANALYTICS,
      templateIntegrationDone: process.env.SENDGRID_TEMPLATE_INTEGRATION_DONE,
      templateCsvExport: process.env.SENDGRID_TEMPLATE_CSV_EXPORT,
      templateEagleEyeDigest: process.env.SENDGRID_TEMPLATE_EAGLE_EYE_DIGEST,
    }

export const NETLIFY_CONFIG: NetlifyConfiguration = KUBE_MODE
  ? config.get<NetlifyConfiguration>('netlify')
  : {
      apiKey: process.env.NETLIFY_API_KEY,
      siteDomain: process.env.NETLIFY_SITE_DOMAIN,
    }

export const CUBEJS_CONFIG: CubeJSConfiguration = KUBE_MODE
  ? config.get<CubeJSConfiguration>('cubejs')
  : {
      url: process.env.CUBE_JS_URL,
      jwtSecret: process.env.CUBE_JS_JWT_SECRET,
      jwtExpiry: process.env.CUBE_JS_JWT_EXPIRY,
    }

export const NANGO_CONFIG: NangoConfiguration = config.get<NangoConfiguration>('nango')

export const ENRICHMENT_CONFIG: EnrichmentConfiguration = KUBE_MODE
  ? config.get<EnrichmentConfiguration>('enrichment')
  : {
      url: process.env.ENRICHMENT_URL,
      apiKey: process.env.ENRICHMENT_SECRET_KEY,
    }

export const ORGANIZATION_ENRICHMENT_CONFIG: OrganizationEnrichmentConfiguration = KUBE_MODE
  ? config.get<OrganizationEnrichmentConfiguration>('organizationEnrichment')
  : {
      apiKey: process.env.ORGANIZATION_ENRICHMENT_SECRET_KEY,
    }

export const EAGLE_EYE_CONFIG: EagleEyeConfiguration = KUBE_MODE
  ? config.get<EagleEyeConfiguration>('eagleEye')
  : {
      url: process.env.EAGLE_EYE_URL,
      apiKey: process.env.EAGLE_EYE_SECRET_KEY,
    }

export const UNLEASH_CONFIG: UnleashConfiguration = config.get<UnleashConfiguration>('unleash')

export const STACKEXCHANGE_CONFIG: StackExchangeConfiguration =
  config.get<StackExchangeConfiguration>('stackexchange') ?? {
    key: process.env.STACKEXCHANGE_KEY,
  }

export const SLACK_ALERTING_CONFIG: SlackAlertingConfiguration = KUBE_MODE
  ? config.get<SlackAlertingConfiguration>('slackAlerting')
  : {
      url: process.env.SLACK_ALERTING_URL,
    }

export const SAMPLE_DATA_CONFIG: SampleDataConfiguration = KUBE_MODE
  ? config.get<SampleDataConfiguration>('sampleData')
  : {
      tenantId: process.env.SAMPLE_DATA_TENANT_ID,
    }

export const INTEGRATION_PROCESSING_CONFIG: IntegrationProcessingConfiguration =
  config.get<IntegrationProcessingConfiguration>('integrationProcessing')
