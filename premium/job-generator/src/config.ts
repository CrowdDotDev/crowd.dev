import config from 'config'
import { SQSConfiguration, TenantMode } from './types'

export const TENANT_MODE: TenantMode = process.env.TENANT_MODE as TenantMode

export const IS_TEST_ENV: boolean = process.env.NODE_ENV === 'test'

export const IS_DEV_ENV: boolean =
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === 'docker' ||
  process.env.NODE_ENV === undefined

export const IS_PROD_ENV: boolean = process.env.NODE_ENV === 'production'

export const IS_STAGING_ENV: boolean = process.env.NODE_ENV === 'staging'

export const IS_CLOUD_ENV: boolean = IS_PROD_ENV || IS_STAGING_ENV

export const SQS_CONFIG: SQSConfiguration = config.get<SQSConfiguration>('sqs')

export const LOG_LEVEL: string = process.env.LOG_LEVEL || 'info'

export const SERVICE: string = process.env.SERVICE
