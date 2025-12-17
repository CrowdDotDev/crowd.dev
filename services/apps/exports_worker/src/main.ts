import sendgrid from '@sendgrid/mail'

import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'

const config: Config = {
  envvars: [
    'CROWD_SENDGRID_KEY',
    'CROWD_SENDGRID_TEMPLATE_CSV_EXPORT',
    'CROWD_SENDGRID_NAME_FROM',
    'CROWD_SENDGRID_EMAIL_FROM',
  ],
  producer: {
    enabled: false,
  },
  temporal: {
    enabled: false,
  },
  redis: {
    enabled: true,
  },
}

const options: Options = {
  postgres: {
    enabled: true,
  },
  opensearch: {
    enabled: true,
  },
}

export const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.init()

  sendgrid.setApiKey(process.env['CROWD_SENDGRID_KEY'])

  await svc.start()
})
