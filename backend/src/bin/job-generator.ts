import { CronJob } from 'cron'
import { getServiceLogger } from '@crowd/logging'
import { SpanStatusCode, getServiceTracer } from '@crowd/tracing'
import fs from 'fs'
import path from 'path'
import { Sequelize, QueryTypes } from 'sequelize'
import jobs from './jobs'
import { databaseInit } from '@/database/databaseConnection'

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

const liveFilePath = path.join(__dirname, 'live.tmp')
const readyFilePath = path.join(__dirname, 'ready.tmp')

let seq: Sequelize
if (!seq) {
  databaseInit()
    .then((db) => {
      seq = db.sequelize as Sequelize
    })
    .then(() => {
      log.info('Checking readiness for job generator.')
      seq.query('select 1', { type: QueryTypes.SELECT }).then((res) => {
        const dbPingRes = res.length === 1
        if (dbPingRes) {
          log.info('Job generator is ready.')
          fs.promises.writeFile(readyFilePath, 'Job generator is ready.').catch((err) => {
            log.error(`Error writing ready.tmp: ${err}`)
          })
        }
      })
    })
}

setInterval(async () => {
  try {
    log.info('Checking liveness for job generator.')
    const res = await seq.query('select 1', { type: QueryTypes.SELECT })
    const dbPingRes = res.length === 1
    if (dbPingRes) {
      await fs.promises.writeFile(liveFilePath, 'Job generator is live.')
      log.info('Job generator is live.')
    }
  } catch (err) {
    log.error(`Error writing live.tmp: ${err}`)
  }
}, 5000)
