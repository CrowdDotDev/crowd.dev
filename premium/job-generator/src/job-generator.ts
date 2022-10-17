import { CronJob } from 'cron'
import jobs from './jobs'

for (const job of jobs) {
  const cronJob = new CronJob(
    job.cronTime,
    async () => {
      console.log(`Triggering premium job: ${job.name}!`)
      try {
        await job.onTrigger()
      } catch (err) {
        console.log(`Error while executing premium job: ${job.name}!`, err)
      }
    },
    null,
    true,
  )
  if (cronJob.running) {
    console.log(`Scheduled premium job: ${job.name}!`)
  }
}
