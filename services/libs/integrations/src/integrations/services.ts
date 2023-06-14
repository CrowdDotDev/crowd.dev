import { getServiceChildLogger } from '@crowd/logging'
import fs from 'fs'
import path from 'path'
import { IIntegrationDescriptor } from '../types'

const log = getServiceChildLogger('integrations')

export const INTEGRATION_SERVICES: IIntegrationDescriptor[] = []

const intFolder = path.resolve(`${__dirname}/`)

const integrationFolders = fs
  .readdirSync(intFolder, { withFileTypes: true })
  .filter(
    (dir) =>
      dir.isDirectory() &&
      dir.name !== 'premium' &&
      fs.existsSync(`${intFolder}/${dir.name}/index.js`),
  )

for (const intFolder of integrationFolders) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  INTEGRATION_SERVICES.push(require(`./${intFolder.name}`).default)
}

// add premium integrations - check for js because library is compiled to javascript
const premiumFolder = path.resolve(`${__dirname}/premium`)
log.info({ premiumFolder }, 'Checking for premium integrations!')

if (fs.existsSync(premiumFolder)) {
  const premiumIntFolders = fs
    .readdirSync(premiumFolder, { withFileTypes: true })
    .filter(
      (dir) => dir.isDirectory() && fs.existsSync(`${premiumIntFolders}/${dir.name}/index.js`),
    )

  if (premiumIntFolders.length > 0) {
    for (const premiumIntFolder of premiumIntFolders) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      INTEGRATION_SERVICES.push(require(`./premium/${premiumIntFolder.name}`).default)
    }
  }
}

log.info(
  { types: INTEGRATION_SERVICES.map((i) => i.type) },
  `Loaded ${INTEGRATION_SERVICES.length} integrations`,
)
