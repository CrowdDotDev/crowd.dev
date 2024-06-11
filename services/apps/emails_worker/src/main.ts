import sendgrid from '@sendgrid/mail'

import { Config } from '@crowd/archetype-standard'
import { Options, ServiceWorker } from '@crowd/archetype-worker'

import { scheduleEmailAnalyticsWeekly, scheduleEmailEagleEyeDigest } from './schedules'

const config: Config = {
  envvars: [
    'CROWD_API_FRONTEND_URL',
    'CROWD_EAGLE_EYE_URL',
    'CROWD_EAGLE_EYE_API_KEY',
    'CROWD_SENDGRID_KEY',
    'CROWD_SENDGRID_TEMPLATE_EAGLE_EYE_DIGEST',
    'CROWD_SENDGRID_TEMPLATE_WEEKLY_ANALYTICS',
    'CROWD_SENDGRID_WEEKLY_ANALYTICS_UNSUBSCRIBE_GROUP_ID',
    'CROWD_SENDGRID_NAME_FROM',
    'CROWD_SENDGRID_EMAIL_FROM',
  ],
  producer: {
    enabled: false,
  },
  temporal: {
    enabled: true,
  },
  questdb: {
    enabled: true,
  },
  redis: {
    enabled: false,
  },
}

const options: Options = {
  maxTaskQueueActivitiesPerSecond: process.env['CROWD_TEMPORAL_TASKQUEUE_EMAILS_MAX_ACTIVITIES']
    ? Number(process.env['CROWD_TEMPORAL_TASKQUEUE_EMAILS_MAX_ACTIVITIES'])
    : Infinity,
  postgres: {
    enabled: true,
  },
  opensearch: {
    enabled: false,
  },
}

export const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.init()

  sendgrid.setApiKey(process.env['CROWD_SENDGRID_KEY'])

  await scheduleEmailEagleEyeDigest()
  await scheduleEmailAnalyticsWeekly()

  await svc.start()
})
