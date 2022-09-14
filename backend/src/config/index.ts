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
  FacebookConfiguration,
  DiscordConfiguration,
  ServiceType,
  SearchEngineConfiguration,
  SegmentConfiguration,
  GithubConfiguration,
  SendgridConfiguration,
  NetlifyConfiguration,
  TenantMode,
  CubeJSConfiguration,
} from './configTypes'

export const SERVICE: ServiceType = process.env.SERVICE_NAME as ServiceType

export const TENANT_MODE: TenantMode = process.env.TENANT_MODE as TenantMode

export const IS_TEST_ENV: boolean = process.env.NODE_ENV === 'test'

export const IS_DEV_ENV: boolean =
  process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'docker'

export const IS_PROD_ENV: boolean = process.env.NODE_ENV === 'production'

export const IS_STAGING_ENV: boolean = process.env.NODE_ENV === 'staging'

export const SQS_CONFIG: SQSConfiguration = config.get<SQSConfiguration>('sqs')

export const S3_CONFIG: S3Configuration = config.get<S3Configuration>('s3')

export const DB_CONFIG: DbConfiguration = config.get<DbConfiguration>('db')

export const SEARCH_ENGINE_CONFIG: SearchEngineConfiguration =
  config.get<SearchEngineConfiguration>('searchEngine')

export const SEGMENT_CONFIG: SegmentConfiguration = config.get<SegmentConfiguration>('segment')

export const API_CONFIG: ApiConfiguration = config.get<ApiConfiguration>('api')

export const PLANS_CONFIG: PlansConfiguration = config.get<PlansConfiguration>('plans')

export const TWITTER_CONFIG: TwitterConfiguration = config.get<TwitterConfiguration>('twitter')

export const SLACK_CONFIG: SlackConfiguration = config.get<SlackConfiguration>('slack')

export const GOOGLE_CONFIG: GoogleConfiguration = config.get<GoogleConfiguration>('google')

export const FACEBOOK_CONFIG: FacebookConfiguration = config.get<FacebookConfiguration>('facebook')

export const DISCORD_CONFIG: DiscordConfiguration = config.get<DiscordConfiguration>('discord')

export const GITHUB_CONFIG: GithubConfiguration = config.get<GithubConfiguration>('github')

export const SENDGRID_CONFIG: SendgridConfiguration = config.get<SendgridConfiguration>('sendgrid')

export const NETLIFY_CONFIG: NetlifyConfiguration = config.get<NetlifyConfiguration>('netlify')

export const CUBEJS_CONFIG: CubeJSConfiguration = config.get<CubeJSConfiguration>('cubejs')

// should only be used for non-kubernetes env
export function getConfig(): any {
  if (process.env.ENV_MODE !== 'serverless') {
    throw new Error('should only be used in serverless mode!')
  }
  return process.env
}
