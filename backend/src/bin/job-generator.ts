import { CronJob } from 'cron'
import { getServiceLogger } from '@crowd/logging'
import { SpanStatusCode, getServiceTracer } from '@crowd/tracing'
import fs from 'fs'
import path from 'path'
import { Sequelize, QueryTypes } from 'sequelize'
import { getRedisClient, RedisClient } from '@crowd/redis'
import jobs from './jobs'
import { databaseInit } from '@/database/databaseConnection'
import { REDIS_CONFIG } from '../conf'

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

const liveFilePath = path.join(__dirname, 'tmp/job-generator-live.tmp')
const readyFilePath = path.join(__dirname, 'tmp/job-generator-ready.tmp')

let seq: Sequelize
let redis: RedisClient
const initRedisSeq = async () => {
  if (!seq) {
    seq = (await databaseInit()).sequelize as Sequelize
  }

  if (!redis) {
    redis = await getRedisClient(REDIS_CONFIG, true)
  }
}

setInterval(async () => {
  try {
    await initRedisSeq()
    log.debug('Checking liveness and readiness for job generator.')
    const [redisPingRes, dbPingRes] = await Promise.all([
      // ping redis,
      redis.ping().then((res) => res === 'PONG'),
      // ping database
      seq.query('select 1', { type: QueryTypes.SELECT }).then((rows) => rows.length === 1),
    ])
    if (redisPingRes && dbPingRes) {
      await Promise.all([
        fs.promises.open(liveFilePath, 'a').then((file) => file.close()),
        fs.promises.open(readyFilePath, 'a').then((file) => file.close()),
      ])
    }
  } catch (err) {
    log.error(`Error checking liveness and readiness for job generator: ${err}`)
  }
}, 5000)
