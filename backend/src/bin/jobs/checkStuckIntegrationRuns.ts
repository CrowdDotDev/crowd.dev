import { processPaginated } from '@crowd/common'
import { Logger, getChildLogger, getServiceChildLogger } from '@crowd/logging'
import cronGenerator from 'cron-time-generator'
import moment from 'moment'
import { INTEGRATION_PROCESSING_CONFIG } from '../../conf'
import IncomingWebhookRepository from '../../database/repositories/incomingWebhookRepository'
import IntegrationRepository from '../../database/repositories/integrationRepository'
import IntegrationRunRepository from '../../database/repositories/integrationRunRepository'
import IntegrationStreamRepository from '../../database/repositories/integrationStreamRepository'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { sendNodeWorkerMessage } from '../../serverless/utils/nodeWorkerSQS'
import { IntegrationRun, IntegrationRunState } from '../../types/integrationRunTypes'
import { IntegrationStreamState } from '../../types/integrationStreamTypes'
import { CrowdJob } from '../../types/jobTypes'
import { NodeWorkerProcessWebhookMessage } from '../../types/mq/nodeWorkerProcessWebhookMessage'

const log = getServiceChildLogger('checkStuckIntegrationRuns')

// we are checking "integrationRuns"."updatedAt" column
const THRESHOLD_HOURS = 1

let running = false

export const checkStuckIntegrations = async (): Promise<void> => {
  // find integrations that are in-progress but their last integration run is:
  // in final state (processed or error) and it has no streams
  // this happens when integration run is triggered but for some reason fails before streams are generated
  const dbOptions = await SequelizeRepository.getDefaultIRepositoryOptions()
  const runsRepo = new IntegrationRunRepository(dbOptions)
  const streamsRepo = new IntegrationStreamRepository(dbOptions)

  await processPaginated(
    async (page: number) => IntegrationRepository.findByStatus('in-progress', page, 10, dbOptions),
    async (inProgressIntegrations) => {
      log.info(`Found ${inProgressIntegrations.length} integrations in progress!`)
      for (const integration of inProgressIntegrations) {
        const lastRun = await runsRepo.findLastRun(integration.id)

        if (
          lastRun.state === IntegrationRunState.PROCESSED ||
          lastRun.state === IntegrationRunState.ERROR
        ) {
          const streams = await streamsRepo.findByRunId(lastRun.id, 1, 1)
          if (streams.length === 0) {
            log.info(
              `Found integration ${integration.id} in progress but last run ${lastRun.id} is in final state and has no streams! Restarting the run!`,
            )

            await runsRepo.restart(lastRun.id)
            const delayUntil = moment().add(1, 'second').toDate()
            await runsRepo.delay(lastRun.id, delayUntil)
          }
        }
      }
    },
  )
}

export const isRunStuck = async (
  run: IntegrationRun,
  streamsRepo: IntegrationStreamRepository,
  runsRepo: IntegrationRunRepository,
  logger: Logger,
): Promise<boolean> => {
  const now = moment()

  // let's first check if the integration run itself is older than 3 hours
  // we are updating updatedAt at the end of the integration run when we process all streams or if it's stopped by rate limit/delays
  // so it should be a good indicator if the integration run is stuck
  // but because some integrations are really long running it must not be the only one

  const integrationLastUpdatedAt = moment(run.updatedAt)
  const diff = now.diff(integrationLastUpdatedAt, 'hours')

  if (diff < THRESHOLD_HOURS) {
    return false
  }

  log.warn({ runId: run.id }, 'Investigating possible stuck integration run!')

  // first lets check if the we have any integration streams that are in state processing
  // and if we have let's see when were they moved to that state based on updatedAt column
  // if they are older than 3 hours we will reset them to pending state and start integration back up
  const processingStreams = await streamsRepo.findByRunId(
    run.id,
    1,
    1,
    [IntegrationStreamState.PROCESSING],
    '"updatedAt" desc',
    [`"updatedAt" < now() - interval '${THRESHOLD_HOURS} hours'`],
  )

  let stuck = false
  if (processingStreams.length > 0) {
    const stream = processingStreams[0]
    logger.warn(
      { streamId: stream.id },
      'Found stuck processing stream! Reseting all processing streams!',
    )
    stuck = true

    await processPaginated(
      async (page: number) =>
        streamsRepo.findByRunId(run.id, page, 10, [IntegrationStreamState.PROCESSING]),
      async (streams) => {
        for (const stream of streams) {
          await streamsRepo.reset(stream.id)
        }
      },
    )
  }

  // if there were no processing streams lets check if we have pending streams that are older than 3 hours
  if (!stuck) {
    const pendingStreams = await streamsRepo.findByRunId(
      run.id,
      1,
      1,
      [IntegrationStreamState.PENDING],
      '"updatedAt" desc',
      [`"updatedAt" < now() - interval '${THRESHOLD_HOURS} hours'`],
    )
    if (pendingStreams.length > 0) {
      const stream = pendingStreams[0]
      logger.warn({ streamId: stream.id }, 'Found stuck pending stream!')
      stuck = true
    }
  }

  // and the last check is to see whether we have any errored streams that are older than 3 hours and haven't been retried enough times
  if (!stuck) {
    const errorStreams = await streamsRepo.findByRunId(
      run.id,
      1,
      1,
      [IntegrationStreamState.ERROR],
      '"updatedAt" desc',
      [
        `"updatedAt" < now() - interval '${THRESHOLD_HOURS} hours'`,
        `"retries" < ${INTEGRATION_PROCESSING_CONFIG.maxRetries}`,
      ],
    )

    if (errorStreams.length > 0) {
      logger.warn(`Found errored streams with not enough retries!`)
      const stream = errorStreams[0]
      logger.warn({ streamId: stream.id }, 'Found stuck errored stream!')
      stuck = true
    }
  }

  // this check tries to see whether the integration run is actually finished but it's in a wrong state
  // by checking all streams and determining whether they are in a final state
  if (!stuck) {
    // check if there are any streams that are not in a final state
    const notFinalStreams = await streamsRepo.findByRunId(run.id, 1, 1, [
      IntegrationStreamState.PENDING,
      IntegrationStreamState.PROCESSING,
    ])

    if (notFinalStreams.length === 0) {
      logger.warn(
        'Found no streams in a final state! Setting integration to either error or processed!',
      )

      const state = await runsRepo.touchState(run.id)
      if (state !== IntegrationRunState.ERROR && state !== IntegrationRunState.PROCESSED) {
        logger.error('Integration is not in a final state! Requires manual intervention!')
      }
    }
  }

  return stuck
}

export const checkRuns = async (): Promise<void> => {
  const dbOptions = await SequelizeRepository.getDefaultIRepositoryOptions()
  const runsRepo = new IntegrationRunRepository(dbOptions)
  const streamsRepo = new IntegrationStreamRepository(dbOptions)

  await processPaginated(
    async (page) =>
      runsRepo.findIntegrationsByState(
        [IntegrationRunState.PENDING, IntegrationRunState.PROCESSING],
        page,
        10,
      ),
    async (runsToCheck) => {
      for (const run of runsToCheck) {
        const logger = getChildLogger('fixer', log, { runId: run.id })
        const stuck = await isRunStuck(run, streamsRepo, runsRepo, logger)
        if (stuck) {
          logger.warn('Delaying integration for 1 second to restart it!')
          const delayUntil = moment().add(1, 'second').toDate()
          await runsRepo.delay(run.id, delayUntil)
        }
      }
    },
  )
}

export const checkStuckWebhooks = async (): Promise<void> => {
  const dbOptions = await SequelizeRepository.getDefaultIRepositoryOptions()
  const repo = new IncomingWebhookRepository(dbOptions)

  await processPaginated(
    async (page) => repo.findPending(page, 20),
    async (webhooks) => {
      for (const webhook of webhooks) {
        log.warn({ id: webhook.id }, 'Found stuck webhook! Restarting it!')
        await sendNodeWorkerMessage(
          webhook.tenantId,
          new NodeWorkerProcessWebhookMessage(webhook.tenantId, webhook.id),
        )
      }
    },
  )
}

const job: CrowdJob = {
  name: 'Detect & Fix Stuck Integration Runs',
  cronTime: cronGenerator.every(30).minutes(),
  onTrigger: async () => {
    if (!running) {
      running = true
      try {
        await Promise.all([checkRuns(), checkStuckIntegrations(), checkStuckWebhooks()])
      } finally {
        running = false
      }
    }
  },
}

export default job
