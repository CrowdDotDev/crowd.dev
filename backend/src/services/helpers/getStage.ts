import { IS_PROD_ENV, IS_STAGING_ENV } from '../../conf'

export default function getStage() {
  if (IS_PROD_ENV) return 'prod'
  if (IS_STAGING_ENV) return 'staging'
  return 'local'
}
