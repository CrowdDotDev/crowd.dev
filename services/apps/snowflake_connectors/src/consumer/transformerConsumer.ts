/**
 * Transformer consumer: Infinite loop that polls DB → transforms.
 *
 * Continuously polls the metadata store for pending jobs
 * that need transformation, then runs the appropriate transformer.
 */

import { PlatformType } from '@crowd/types'
import { getServiceChildLogger } from '@crowd/logging'
import { getDbConnection, WRITE_DB_CONFIG } from '@crowd/database'
import { QueueFactory, QUEUE_CONFIG } from '@crowd/queue'
import { getRedisClient, REDIS_CONFIG, RedisCache } from '@crowd/redis'
import { DataSinkWorkerEmitter } from '@crowd/common_services'

import { MetadataStore, SnowflakeExportJob } from '../core/metadataStore'
import { S3Consumer } from '../core/s3Consumer'
import { IntegrationResolver } from '../core/integrationResolver'
import { getPlatform, getEnabledPlatforms } from '../integrations'

const log = getServiceChildLogger('transformerConsumer')

const MAX_POLLING_INTERVAL_MS = 30 * 60 * 1000 // 30 minutes

export class TransformerConsumer {
  private running = false
  private currentPollingIntervalMs: number

  constructor(
    private readonly metadataStore: MetadataStore,
    private readonly s3Consumer: S3Consumer,
    private readonly integrationResolver: IntegrationResolver,
    private readonly emitter: DataSinkWorkerEmitter,
    private readonly pollingIntervalMs: number,
  ) {
    this.currentPollingIntervalMs = pollingIntervalMs
  }

  async start(): Promise<void> {
    this.running = true
    log.info('Transformer consumer started')

    while (this.running) {
      try {
        const job = await this.metadataStore.claimOldestPendingJob()
        log.info('Claiming job from metadata store', { job })

        if (job) {
          log.info({ jobId: job.id, platform: job.platform, s3Path: job.s3Path }, 'Processing job')
          this.currentPollingIntervalMs = this.pollingIntervalMs
          await this.processJob(job)
          continue
        }
      } catch (err) {
        log.error({ err }, 'Error in consumer loop')
        await this.sleep(this.pollingIntervalMs)
        continue
      }

      log.info({ currentPollingIntervalMs: this.currentPollingIntervalMs }, 'No pending jobs, backing off')
      await this.sleep(this.currentPollingIntervalMs)
      this.currentPollingIntervalMs = Math.min(this.currentPollingIntervalMs * 2, MAX_POLLING_INTERVAL_MS)
    }

    log.info('Transformer consumer stopped')
  }

  stop(): void {
    this.running = false
  }

  private async processJob(job: SnowflakeExportJob): Promise<void> {
    log.info({ jobId: job.id, platform: job.platform, s3Path: job.s3Path }, 'Processing job')

    const startTime = Date.now()

    try {
      const platformDef = getPlatform(job.platform as PlatformType)

      const rows = await this.s3Consumer.readParquetRows(job.s3Path)

      let transformedCount = 0
      let skippedCount = 0

      for (const row of rows) {
        const result = platformDef.transformer.safeTransformRow(row)
        if (!result) {
          skippedCount++
          continue
        }

        const resolved = await this.integrationResolver.resolve(
          job.platform as PlatformType,
          result.segment,
        )
        if (!resolved) {
          skippedCount++
          continue
        }

        await this.emitter.createAndProcessActivityResult(resolved.segmentId, resolved.integrationId, result.activity)
        transformedCount++
      }

      const processingMetrics = {
        transformedCount,
        skippedCount,
        processingDurationMs: Date.now() - startTime,
      }

      await this.metadataStore.markCompleted(job.id, processingMetrics)

      log.info({ jobId: job.id, ...processingMetrics }, 'Job completed')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      log.error({ jobId: job.id, err }, 'Job failed')

      try {
        await this.metadataStore.markFailed(job.id, errorMessage, { processingDurationMs: Date.now() - startTime })
      } catch (updateErr) {
        log.error({ jobId: job.id, updateErr }, 'Failed to mark job as failed')
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export async function createTransformerConsumer(): Promise<TransformerConsumer> {
  const db = await getDbConnection(WRITE_DB_CONFIG())
  const metadataStore = new MetadataStore(db)
  const s3Consumer = new S3Consumer()
  const redisClient = await getRedisClient(REDIS_CONFIG(), true)
  const cache = new RedisCache('snowflake-integration-resolver', redisClient, log)
  const resolver = new IntegrationResolver(db, cache)
  await resolver.preloadPlatforms(getEnabledPlatforms())

  const queueClient = QueueFactory.createQueueService(QUEUE_CONFIG())
  const emitter = new DataSinkWorkerEmitter(queueClient, log)
  await emitter.init()

  const pollingIntervalMs = 10_000 // 10 seconds

  return new TransformerConsumer(metadataStore, s3Consumer, resolver, emitter, pollingIntervalMs)
}
