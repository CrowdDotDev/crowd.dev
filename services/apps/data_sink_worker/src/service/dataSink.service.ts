import {
  addSeconds,
  generateUUIDv1,
  groupBy,
  single,
  singleOrDefault,
  timeout,
} from '@crowd/common'
import { UnrepeatableError } from '@crowd/common'
import { DataSinkWorkerEmitter, SearchSyncWorkerEmitter } from '@crowd/common_services'
import { DbStore } from '@crowd/data-access-layer/src/database'
import {
  IIntegrationData,
  IResultData,
} from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/dataSink.data'
import DataSinkRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/dataSink.repo'
import { Logger, LoggerBase, logExecutionTimeV2 } from '@crowd/logging'
import { IQueue } from '@crowd/queue'
import { RedisClient } from '@crowd/redis'
import telemetry from '@crowd/telemetry'
import { Client as TemporalClient } from '@crowd/temporal'
import {
  IActivityData,
  IIntegrationResult,
  IMemberData,
  IntegrationResultState,
  IntegrationResultType,
  PlatformType,
} from '@crowd/types'

import { WORKER_SETTINGS } from '../conf'

import ActivityService from './activity.service'
import MemberService from './member.service'

export default class DataSinkService extends LoggerBase {
  private readonly repo: DataSinkRepository

  constructor(
    private readonly pgStore: DbStore,
    private readonly qdbStore: DbStore,
    private readonly searchSyncWorkerEmitter: SearchSyncWorkerEmitter,
    private readonly dataSinkWorkerEmitter: DataSinkWorkerEmitter,
    private readonly redisClient: RedisClient,
    private readonly temporal: TemporalClient,
    private readonly client: IQueue,
    parentLog: Logger,
  ) {
    super(parentLog)

    this.repo = new DataSinkRepository(pgStore, this.log)
  }

  private async triggerResultError(
    resultInfo: IResultData,
    resultExists: boolean,
    location: string,
    message: string,
    metadata?: unknown,
    error?: Error,
  ): Promise<void> {
    const errorData = {
      location,
      message,
      metadata,
      errorMessage: error?.message,
      errorStack: error?.stack,
      errorString: error ? JSON.stringify(error) : undefined,
    }

    if (
      !(error instanceof UnrepeatableError) &&
      resultInfo.retries + 1 <= WORKER_SETTINGS().maxStreamRetries
    ) {
      // delay for #retries * 2 minutes
      const until = addSeconds(new Date(), (resultInfo.retries + 1) * 2 * 60)
      this.log.warn({ until: until.toISOString() }, 'Retrying result!')

      await this.repo.delayResult(
        resultInfo.id,
        until,
        errorData,
        resultExists ? undefined : resultInfo,
      )
    } else {
      await this.repo.markResultError(
        resultInfo.id,
        errorData,
        resultExists ? undefined : resultInfo,
      )
    }
  }

  public async checkResults(): Promise<void> {
    this.log.info('Checking for delayed results!')

    let results = await this.repo.transactionally(async (txRepo) => {
      return await txRepo.getDelayedResults(10)
    })

    while (results.length > 0) {
      this.log.info({ count: results.length }, 'Found delayed results!')

      for (const result of results) {
        this.log.info({ resultId: result.id }, 'Restarting delayed stream!')
        await this.repo.resetResults([result.id])
        await this.dataSinkWorkerEmitter.triggerResultProcessing(
          result.id,
          result.id,
          result.onboarding === null ? true : result.onboarding,
          `${result.id}-delayed-${Date.now()}`,
        )
      }

      results = await this.repo.transactionally(async (txRepo) => {
        return await txRepo.getDelayedResults(10)
      })
    }
  }

  public async prepareInMemoryActivityResults(
    results: { segmentId: string; integrationId: string; data: IActivityData; resultId?: string }[],
  ): Promise<{ resultId: string; data: IResultData; created: boolean }[]> {
    const integrationIds = results.map((r) => r.integrationId)
    const integrations = await this.repo.getIntegrationInfos(integrationIds)

    const prepared: { resultId: string; data: IResultData; created: boolean }[] = []

    const promises = []

    for (const toProcess of results) {
      const { segmentId, integrationId, data, resultId } = toProcess
      const id = resultId ?? generateUUIDv1()

      const payload: IIntegrationResult = {
        type: IntegrationResultType.ACTIVITY,
        data,
        segmentId,
      }

      const result: IResultData = {
        id,
        integrationId,
        data: payload,
        state: IntegrationResultState.PENDING,
        runId: null,
        streamId: null,
        webhookId: null,
        platform: null,
        segmentId,
        retries: 0,
        delayedUntil: null,
        onboarding: false,
      }

      let integration: IIntegrationData | null = null

      if (integrationId) {
        integration = singleOrDefault(integrations, (i) => i.integrationId === integrationId)

        if (integration) {
          result.platform = integration.platform

          if (result.platform === PlatformType.GITHUB_NANGO) {
            result.platform = PlatformType.GITHUB
          }

          const platform = (payload.data as IActivityData).platform as PlatformType

          if (
            segmentId &&
            integration.segmentId !== segmentId &&
            ![PlatformType.GITHUB, PlatformType.GITLAB].includes(platform)
          ) {
            // save error and stop
            await logExecutionTimeV2(
              async () =>
                this.repo.markResultError(
                  id,
                  new Error(
                    `Segment id from queue message '${segmentId}' does not equal integration '${integration.integrationId}' segment id '${integration.segmentId}'!`,
                  ),
                  resultId === undefined ? result : undefined,
                ),
              this.log,
              'dataSinkService -> processActivityInMemoryResult -> markResultError',
            )
            return
          }

          if (!segmentId) {
            result.segmentId = integration.segmentId
          }
        }
      }

      // TODO remove when we have all integrations storing results on their own
      // create result in db first
      if (!resultId) {
        promises.push(this.repo.publishExternalResult(id, integration.integrationId, payload))
      }

      prepared.push({
        resultId: id,
        data: result,
        created: true,
      })
    }

    await Promise.all(promises)

    this.log.info(`Prepared ${prepared.length} in memory results stored ${promises.length} in db!`)

    return prepared
  }

  public async processResults(
    batch: { resultId: string; data: IResultData | undefined; created: boolean }[],
  ): Promise<void> {
    const start = performance.now()

    const results: IResultData[] = []

    const toLoadById: string[] = []
    for (const toProcess of batch) {
      const { resultId, data } = toProcess

      if (!data) {
        toLoadById.push(resultId)
      } else {
        results.push(data)
      }
    }

    if (toLoadById.length > 0) {
      const infos = await this.repo.getResultInfos(toLoadById)
      results.push(...infos)
    }

    const groupedByType = groupBy(results, (r) => r.data.type)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultMap = new Map<string, { success: boolean; err?: any }>()
    const types = Array.from(groupedByType.keys()) as IntegrationResultType[]
    for (const type of types) {
      if (type === IntegrationResultType.ACTIVITY) {
        const results = groupedByType.get(type)

        for (const result of results) {
          if (result.platform === PlatformType.GITHUB_NANGO) {
            result.platform = PlatformType.GITHUB
          }
        }

        const service = new ActivityService(
          this.pgStore,
          this.qdbStore,
          this.searchSyncWorkerEmitter,
          this.redisClient,
          this.temporal,
          this.client,
          this.log,
        )

        let retry = 0
        let toProcess = results

        let lastError: Error | undefined

        while (toProcess.length > 0 && retry < 5) {
          if (retry > 0) {
            await timeout(100)
          }

          try {
            const processResults = await service.processActivities(
              toProcess.map((r) => {
                return {
                  resultId: r.id,
                  integrationId: r.integrationId,
                  onboarding: r.onboarding === null ? true : r.onboarding,
                  platform: r.platform,
                  activity: r.data.data as IActivityData,
                  segmentId: r.data.segmentId ?? r.segmentId,
                }
              }),
              toProcess.some((r) => r.onboarding === true),
            )

            toProcess = []
            for (const [resultId, result] of processResults) {
              if (result.success || result.err instanceof UnrepeatableError) {
                resultMap.set(resultId, result)
              } else {
                toProcess.push(single(results, (r) => r.id === resultId))
              }
            }

            // clear last error because we processed without unhandled error
            lastError = undefined
          } catch (err) {
            // will be retried
            this.log.error(err, 'Unhandled error while processing activities!')
            // save last error so in case we hit retry limit we can set it for all results left to process
            lastError = err
          }

          retry++
        }

        // if lastError is still set and we have some left to process, we set the error for them cuz they were retried but failed
        if (lastError && toProcess.length > 0) {
          for (const leftToProcess of toProcess) {
            resultMap.set(leftToProcess.id, {
              success: false,
              err: lastError,
            })
          }
        }
      } else if (type === IntegrationResultType.TWITTER_MEMBER_REACH) {
        // just process individually
        for (const entry of groupedByType.get(type)) {
          try {
            const service = new MemberService(
              this.pgStore,
              this.searchSyncWorkerEmitter,
              this.temporal,
              this.redisClient,
              this.log,
            )
            const memberData = entry.data.data as IMemberData

            await service.processMemberUpdate(entry.integrationId, entry.platform, memberData)
          } catch (err) {
            resultMap.set(entry.id, { success: false, err })
          }
        }
      } else {
        this.log.error(`Unknown result type: ${type}!`)
      }
    }

    // handle results
    const resultsToDelete: string[] = []
    for (const [resultId, result] of resultMap) {
      const batchEntry = single(batch, (b) => b.resultId === resultId)

      if (!result.success) {
        const resultInfo = single(results, (r) => r.id === resultId)

        await this.triggerResultError(
          resultInfo,
          batchEntry.created,
          'process-result',
          'Error processing result.',
          undefined,
          result.err,
        )
      } else if (batchEntry.created) {
        resultsToDelete.push(resultId)
      }
    }

    if (resultsToDelete.length > 0) {
      await this.repo.deleteResults(resultsToDelete)
    }

    const end = performance.now()
    const totalTime = end - start

    for (const type of types) {
      const items = groupedByType.get(type)
      const msPerItem = Math.floor(totalTime / items.length)

      items.forEach(() => {
        telemetry.distribution('data_sink_worker.process_result', msPerItem, {
          type,
        })
      })
    }
  }
}
