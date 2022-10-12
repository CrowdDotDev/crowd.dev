import { CronJob } from 'cron'
import jobs from './jobs'

for (const job of jobs) {
  const cronJob = new CronJob(
    job.cronTime,
    async () => {
      console.log(`Triggering job: ${job.name}!`)
      try {
        await job.onTrigger()
      } catch (err) {
        console.log(`Error while executing job: ${job.name}!`, err)
      }
    },
    null,
    true,
  )
  if (cronJob.running) {
    console.log(`Scheduled job: ${job.name}!`)
  }
}
