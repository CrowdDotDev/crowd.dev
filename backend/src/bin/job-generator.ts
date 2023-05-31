import { CronJob } from 'cron'
import { getServiceLogger } from '@crowd/logging'
import jobs from './jobs'

const log = getServiceLogger()

for (const job of jobs) {
  const cronJob = new CronJob(
    job.cronTime,
    async () => {
      log.info({ job: job.name }, 'Triggering job.')
      try {
        await job.onTrigger()
      } catch (err) {
        log.error(err, { job: job.name }, 'Error while executing a job!')
      }
    },
    null,
    true,
    'Europe/Berlin',
  )
  if (cronJob.running) {
    log.info({ job: job.name }, 'Scheduled a job.')
  }
}
