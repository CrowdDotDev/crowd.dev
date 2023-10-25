import { ScheduleAlreadyRunning, ScheduleOverlapPolicy } from '@temporalio/client'
import sendgrid from '@sendgrid/mail'

import { Config } from '@crowd/archetype-standard'
import { ServiceWorker, Options } from '@crowd/archetype-worker'

import { getAndSendNextEmails } from './workflows'

const config: Config = {
  envvars: [
    'CROWD_FRONTEND_URL',
    'CROWD_EAGLE_EYE_URL',
    'CROWD_EAGLE_EYE_API_KEY',
    'CROWD_SENDGRID_API_KEY',
    'CROWD_SENDGRID_TEMPLATE_EAGLEEYE_DIGEST',
    'CROWD_SENDGRID_FROM_NAME',
    'CROWD_SENDGRID_FROM_EMAIL',
  ],
  producer: {
    enabled: false,
  },
  temporal: {
    enabled: true,
  },
  redis: {
    enabled: false,
  },
}

const options: Options = {
  postgres: {
    enabled: true,
  },
}

export const svc = new ServiceWorker(config, options)

setImmediate(async () => {
  await svc.init()

  sendgrid.setApiKey(process.env['CROWD_SENDGRID_API_KEY'])

  try {
    await svc.temporal.schedule.create({
      scheduleId: 'email-digest',
      spec: {
        intervals: [
          {
            every: '30 minutes',
          },
        ],
      },
      policies: {
        overlap: ScheduleOverlapPolicy.BUFFER_ONE,
        catchupWindow: '1 minute',
      },
      action: {
        type: 'startWorkflow',
        workflowType: getAndSendNextEmails,
        taskQueue: 'emails',
        workflowExecutionTimeout: '5 minutes',
      },
    })
  } catch (err) {
    if (err instanceof ScheduleAlreadyRunning) {
      svc.log.info('Schedule already registered in Temporal.')
      svc.log.info('Configuration may have changed since. Please make sure they are in sync.')
    } else {
      throw new Error(err)
    }
  }

  await svc.start()
})
