export enum ServiceType {
  API = 'api',
  NODEJS_WORKER = 'nodejs-worker',
  JOB_GENERATOR = 'job-generator',
}

export enum TenantMode {
  SINGLE = 'single',
  MULTI = 'multi',
  MULTI_WITH_SUBDOMAIN = 'multi-with-subdomain',
}

export interface AwsCredentials {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  region: string
}

export interface SQSConfiguration {
  host?: string
  port?: number
  nodejsWorkerQueue: string
  nodejsWorkerDelayableQueue: string
  integrationRunWorkerQueue: string
  pythonWorkerQueue: string
  aws: AwsCredentials
}

export interface S3Configuration {
  host?: string
  port?: number
  integrationsAssetsBucket: string
  microservicesAssetsBucket: string
  aws: AwsCredentials
}

export interface ComprehendConfiguration {
  aws: AwsCredentials
}

export interface ClearbitConfiguration {
  apiKey: string
}

export interface DbConfiguration {
  readHost: string
  writeHost: string
  port: number

  username?: string
  password?: string
  apiUsername?: string
  apiPassword?: string
  nodejsWorkerUsername?: string
  nodejsWorkerPassword?: string
  jobGeneratorUsername?: string
  jobGeneratorPassword?: string

  dialect: string
  database: string
  logging: boolean
  transactions: boolean
}

export interface SearchEngineConfiguration {
  host: string
  apiKey: string
}

export interface SegmentConfiguration {
  writeKey: string
}

export interface ApiConfiguration {
  port: number
  url: string
  frontendUrl: string
  frontendUrlWithSubdomain: string
  edition: string
  jwtSecret: string
  jwtExpiresIn: string
  documentation: boolean
}

export interface PlansConfiguration {
  stripePricePremium: string
  stripePriceEnterprise: string
  stripeSecretKey: string
  stripWebhookSigningSecret: string
  stripeEagleEyePlanProductId: string
  stripeGrowthPlanProductId: string
}

export interface DevtoConfiguration {
  globalLimit?: number
}

export interface TwitterConfiguration {
  clientId: string
  clientSecret: string
  globalLimit?: number
  maxRetrospectInSeconds: number
  limitResetFrequencyDays: number
}

export interface SlackConfiguration {
  clientId: string
  clientSecret: string
  globalLimit?: number
  maxRetrospectInSeconds: number
  reporterToken?: string
  reporterChannel?: string
  teamId?: string
  appId?: string
  appToken?: string
}

export interface SlackNotifierConfiguration {
  clientId: string
  clientSecret: string
}

export interface GoogleConfiguration {
  clientId: string
  clientSecret: string
  callbackUrl: string
}

export interface DiscordConfiguration {
  token: string
  token2: string
  maxRetrospectInSeconds: number
  globalLimit?: number
  limitResetFrequencyDays?: number
}

export interface GithubConfiguration {
  appId: string
  clientId: string
  clientSecret: string
  privateKey: string
  webhookSecret: string
  isCommitDataEnabled: string
  globalLimit?: number
}

export interface SendgridConfiguration {
  key: string
  webhookSigningSecret: string
  emailFrom: string
  nameFrom: string
  templateEmailAddressVerification: string
  templateInvitation: string
  templatePasswordReset: string
  templateWeeklyAnalytics: string
  templateIntegrationDone: string
  templateCsvExport: string
  templateEagleEyeDigest: string
  weeklyAnalyticsUnsubscribeGroupId: string
}

export interface NetlifyConfiguration {
  apiKey: string
  siteDomain: string
}

export interface CubeJSConfiguration {
  url: string
  jwtSecret: string
  jwtExpiry: string
}

export interface NangoConfiguration {
  url: string
  secretKey: string
}

export interface EnrichmentConfiguration {
  url: string
  apiKey: string
}

export interface OrganizationEnrichmentConfiguration {
  apiKey: string
}

export interface EagleEyeConfiguration {
  url: string
  apiKey: string
}

export interface UnleashConfiguration {
  url: string
  adminApiKey: string
  frontendApiKey: string
  backendApiKey: string

  db: {
    host: string
    port: number
    username: string
    password: string
    database: string
  }
}

export interface StackExchangeConfiguration {
  key: string
}

export interface SlackAlertingConfiguration {
  url: string
}

export interface SampleDataConfiguration {
  tenantId: string
}

export interface IntegrationProcessingConfiguration {
  maxRetries: number
}
