import { CronJob } from 'cron'
import { getServiceLogger } from '@crowd/logging'
import { SpanStatusCode, getServiceTracer } from '@crowd/tracing'
import jobs from './jobs'

const tracer = getServiceTracer()
const log = getServiceLogger()

for (const job of jobs) {
  const cronJob = new CronJob(
    job.cronTime,
    async () => {
      await tracer.startActiveSpan(`ProcessingJob:${job.name}`, async (span) => {
        log.info({ job: job.name }, 'Triggering job.')
        try {
          await job.onTrigger(log)
          span.setStatus({
            code: SpanStatusCode.OK,
          })
        } catch (err) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: err,
          })
          log.error(err, { job: job.name }, 'Error while executing a job!')
        } finally {
          span.end()
        }
      })
    },
    null,
    true,
    'Europe/Berlin',
  )
  if (cronJob.running) {
    log.info({ job: job.name }, 'Scheduled a job.')
  }
}
