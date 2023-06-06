import { getServiceChildLogger } from '@crowd/logging'
import fs from 'fs'
import path from 'path'
import { IIntegrationDescriptor } from '../types'
import devto from './devto'
import stackoverflow from './stackoverflow'

const log = getServiceChildLogger('integrations')

export const INTEGRATION_SERVICES: IIntegrationDescriptor[] = [devto, stackoverflow]

log.info(
  { types: INTEGRATION_SERVICES.map((i) => i.type) },
  `Loaded ${INTEGRATION_SERVICES.length} integrations`,
)

// add premium integrations - check for js because library is compiled to javascript
const premiumIndexFile = path.resolve(`${__dirname}/premium/index.js`)
log.info({ premiumIndexFile }, 'Checking for premium integrations!')

if (fs.existsSync(premiumIndexFile)) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const premiumIntegrations: IIntegrationDescriptor[] = require('./premium').default

  if (premiumIntegrations.length > 0) {
    INTEGRATION_SERVICES.push(...premiumIntegrations)

    log.info(
      { types: premiumIntegrations.map((i) => i.type) },
      `Loaded ${premiumIntegrations.length} premium integrations`,
    )
  }
}
