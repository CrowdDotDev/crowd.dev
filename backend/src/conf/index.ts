import config from 'config'

import { IDatabaseConfig } from '@crowd/data-access-layer/src/database'
import { ISearchSyncApiConfig } from '@crowd/opensearch'
import { IQueueClientConfig } from '@crowd/queue'
import { IRedisConfiguration } from '@crowd/redis'
import { IGithubIssueReporterConfiguration } from '@crowd/types'

import {
  ApiConfiguration,
  Auth0Configuration,
  ClearbitConfiguration,
  ComprehendConfiguration,
  CrowdAnalyticsConfiguration,
  DbConfiguration,
  DiscordConfiguration,
  EagleEyeConfiguration,
  EncryptionConfiguration,
  EnrichmentConfiguration,
  GithubConfiguration,
  GithubTokenConfiguration,
  GitlabConfiguration,
  GoogleConfiguration,
  IBackendTemporalConfig,
  IOpenSearchConfig,
  IOpenStatusApiConfig,
  IRedditConfig,
  IntegrationProcessingConfiguration,
  NangoConfiguration,
  NetlifyConfiguration,
  OrganizationEnrichmentConfiguration,
  PlansConfiguration,
  S3Configuration,
  SSOConfiguration,
  SampleDataConfiguration,
  SegmentConfiguration,
  SendgridConfiguration,
  ServiceType,
  SlackAlertingConfiguration,
  SlackConfiguration,
  SlackNotifierConfiguration,
  StackExchangeConfiguration,
  TenantMode,
  TwitterConfiguration,
  UnleashConfiguration,
  WeeklyEmailsConfiguration,
} from './configTypes'

// TODO-kube

export const ENCRYPTION_SECRET_KEY = process.env.ENCRYPTION_SECRET_KEY

export const ENCRYPTION_INIT_VECTOR = process.env.ENCRYPTION_INIT_VECTOR

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

export const ENCRYPTION_CONFIG: EncryptionConfiguration =
  config.get<EncryptionConfiguration>('encryption')

export const QUEUE_CONFIG: IQueueClientConfig = config.get<IQueueClientConfig>('queue')

export const REDIS_CONFIG: IRedisConfiguration = config.get<IRedisConfiguration>('redis')

export const S3_CONFIG: S3Configuration = config.get<S3Configuration>('s3')

export const DB_CONFIG: DbConfiguration = config.get<DbConfiguration>('db')

export const PRODUCT_DB_CONFIG: IDatabaseConfig = config.has('productDb')
  ? config.get<IDatabaseConfig>('productDb')
  : undefined

export const SEGMENT_CONFIG: SegmentConfiguration = config.get<SegmentConfiguration>('segment')

export const COMPREHEND_CONFIG: ComprehendConfiguration =
  config.get<ComprehendConfiguration>('comprehend')

export const CLEARBIT_CONFIG: ClearbitConfiguration = config.get<ClearbitConfiguration>('clearbit')

export const API_CONFIG: ApiConfiguration = config.get<ApiConfiguration>('api')

export const AUTH0_CONFIG: Auth0Configuration = config.get<Auth0Configuration>('auth0')

export const SSO_CONFIG: SSOConfiguration = config.get<SSOConfiguration>('sso')

export const PLANS_CONFIG: PlansConfiguration = config.get<PlansConfiguration>('plans')

export const TWITTER_CONFIG: TwitterConfiguration = config.get<TwitterConfiguration>('twitter')

export const SLACK_CONFIG: SlackConfiguration = config.get<SlackConfiguration>('slack')

export const SLACK_NOTIFIER_CONFIG: SlackNotifierConfiguration =
  config.get<SlackNotifierConfiguration>('slackNotifier')

export const GOOGLE_CONFIG: GoogleConfiguration = config.get<GoogleConfiguration>('google')

export const DISCORD_CONFIG: DiscordConfiguration = config.get<DiscordConfiguration>('discord')

export const GITHUB_CONFIG: GithubConfiguration = config.get<GithubConfiguration>('github')

export const GITHUB_ISSUE_REPORTER_CONFIG: IGithubIssueReporterConfiguration =
  config.get<IGithubIssueReporterConfiguration>('githubIssueReporter')

export const SENDGRID_CONFIG: SendgridConfiguration = config.get<SendgridConfiguration>('sendgrid')

export const NETLIFY_CONFIG: NetlifyConfiguration = config.get<NetlifyConfiguration>('netlify')

export const NANGO_CONFIG: NangoConfiguration = config.get<NangoConfiguration>('nango')

export const ENRICHMENT_CONFIG: EnrichmentConfiguration =
  config.get<EnrichmentConfiguration>('enrichment')

export const ORGANIZATION_ENRICHMENT_CONFIG: OrganizationEnrichmentConfiguration =
  config.get<OrganizationEnrichmentConfiguration>('organizationEnrichment')

export const EAGLE_EYE_CONFIG: EagleEyeConfiguration = config.get<EagleEyeConfiguration>('eagleEye')

export const GITHUB_TOKEN_CONFIG: GithubTokenConfiguration =
  config.get<GithubTokenConfiguration>('githubToken')

export const UNLEASH_CONFIG: UnleashConfiguration = config.get<UnleashConfiguration>('unleash')

export const OPENSEARCH_CONFIG: IOpenSearchConfig = config.get<IOpenSearchConfig>('opensearch')

export const STACKEXCHANGE_CONFIG: StackExchangeConfiguration =
  config.get<StackExchangeConfiguration>('stackexchange') ?? {
    key: process.env.STACKEXCHANGE_KEY,
  }

export const SLACK_ALERTING_CONFIG: SlackAlertingConfiguration =
  config.get<SlackAlertingConfiguration>('slackAlerting')

export const SAMPLE_DATA_CONFIG: SampleDataConfiguration =
  config.get<SampleDataConfiguration>('sampleData')

export const INTEGRATION_PROCESSING_CONFIG: IntegrationProcessingConfiguration =
  config.get<IntegrationProcessingConfiguration>('integrationProcessing')

export const WEEKLY_EMAILS_CONFIG: WeeklyEmailsConfiguration =
  config.get<WeeklyEmailsConfiguration>('weeklyEmails')

export const CROWD_ANALYTICS_CONFIG: CrowdAnalyticsConfiguration =
  config.get<CrowdAnalyticsConfiguration>('crowdAnalytics')

export const TEMPORAL_CONFIG: IBackendTemporalConfig =
  config.get<IBackendTemporalConfig>('temporal')

export const SEARCH_SYNC_API_CONFIG: ISearchSyncApiConfig =
  config.get<ISearchSyncApiConfig>('searchSyncApi')

export const OPEN_STATUS_API_CONFIG: IOpenStatusApiConfig =
  config.get<IOpenStatusApiConfig>('openStatusApi')

export const GITLAB_CONFIG: GitlabConfiguration = config.get<GitlabConfiguration>('gitlab')

export const REDDIT_CONFIG: IRedditConfig = config.get<IRedditConfig>('reddit')
