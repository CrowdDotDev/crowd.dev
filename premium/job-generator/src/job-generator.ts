import { CronJob } from 'cron'
import jobs from './jobs'
import { createServiceLogger } from './logging'

const log = createServiceLogger()

for (const job of jobs) {
  const cronJob = new CronJob(
    job.cronTime,
    async () => {
      log.info(`Triggering premium job: ${job.name}!`)
      try {
        await job.onTrigger()
      } catch (err) {
        log.error(err, `Error while executing premium job: ${job.name}!`)
      }
    },
    null,
    true,
    'Europe/Berlin',
  )
  if (cronJob.running) {
    log.info(`Scheduled premium job: ${job.name}!`)
  }
}
