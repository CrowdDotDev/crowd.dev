import fs from 'fs'
import path from 'path'

import { getServiceChildLogger } from '@crowd/logging'

import { IIntegrationDescriptor } from '../types'

const log = getServiceChildLogger('integrations')

export const INTEGRATION_SERVICES: IIntegrationDescriptor[] = []

const intFolder = path.resolve(`${__dirname}/`)

const integrationFolders = fs
  .readdirSync(intFolder, { withFileTypes: true })
  .filter((dir) => dir.isDirectory() && fs.existsSync(`${intFolder}/${dir.name}/index.ts`))

for (const intFolder of integrationFolders) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  INTEGRATION_SERVICES.push(require(`./${intFolder.name}`).default)
}

log.info(
  { types: INTEGRATION_SERVICES.map((i) => i.type) },
  `Loaded ${INTEGRATION_SERVICES.length} integrations`,
)
