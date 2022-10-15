import { Logger } from '../../../utils/logging'
import { PlatformType } from '../../../utils/platforms'
import { IntegrationServiceBase } from './integrationServiceBase'

export class DevtoIntegrationService extends IntegrationServiceBase {
  constructor(parentLogger: Logger) {
    super(PlatformType.DEVTO, 3, parentLogger)
  }
}
