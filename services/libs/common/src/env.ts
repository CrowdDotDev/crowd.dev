import { Edition } from '@crowd/types'

export const IS_TEST_ENV: boolean = process.env.NODE_ENV === 'test'

export const IS_DEV_ENV: boolean =
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === 'docker' ||
  process.env.NODE_ENV === undefined

export const IS_PROD_ENV: boolean = process.env.NODE_ENV === 'production'

export const IS_STAGING_ENV: boolean = process.env.NODE_ENV === 'staging'

export const LOG_LEVEL: string = process.env.LOG_LEVEL || 'info'

export const IS_CLOUD_ENV: boolean = IS_PROD_ENV || IS_STAGING_ENV

export const SERVICE = process.env.SERVICE || 'unknown-service'

export const EDITION: Edition = process.env.CROWD_EDITION as Edition

export function getEnv() {
  if (IS_PROD_ENV) return 'prod'
  if (IS_STAGING_ENV) return 'staging'
  return 'local'
}
