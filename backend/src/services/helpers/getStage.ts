import { getConfig } from '../../config'

export default function getStage() {
  switch (getConfig().NODE_ENV) {
    case 'production':
      return 'prod'
    case 'staging':
      return 'staging'
    default:
      return 'local'
  }
}
