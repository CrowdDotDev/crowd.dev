import { startUnleash } from 'unleash-client'
import { getServiceLogger } from '../utils/logging'
import { UNLEASH_CONFIG } from '../config'

const log = getServiceLogger()

setImmediate(async () => {
  const unleash = await startUnleash({
    url: `${UNLEASH_CONFIG.url}/api`,
    appName: 'test',
    customHeaders: {
      Authorization: UNLEASH_CONFIG.backendApiKey,
    },
  })

  log.info('Unleash client is ready!')
  const defs = unleash.getFeatureToggleDefinitions()
  console.log(defs)
})
