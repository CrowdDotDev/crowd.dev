import cronGenerator from 'cron-time-generator'
import moment from 'moment'
import { IntegrationStream, IntegrationStreamState } from '../../types/integrationStreamTypes'
import { createChildLogger, createServiceChildLogger } from '../../utils/logging'
import IntegrationRunRepository from '../../database/repositories/integrationRunRepository'
import IntegrationStreamRepository from '../../database/repositories/integrationStreamRepository'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { CrowdJob } from '../../types/jobTypes'
import { IntegrationRunState } from '../../types/integrationRunTypes'
import { INTEGRATION_PROCESSING_CONFIG } from '../../config'

const log = createServiceChildLogger('checkStuckIntegrationRuns')

const THRESHOLD_HOURS = 3

let running = false

function sortStreamsFromNewestToOldest(streams: IntegrationStream[]) {
  streams.sort((a, b) => {
    const aDate = moment(a.updatedAt)
    const bDate = moment(b.updatedAt)

    if (aDate.isBefore(bDate)) {
      return 1
    }
    if (aDate.isAfter(bDate)) {
      return -1
    }
    return 0
  })
}

const job: CrowdJob = {
  name: 'Detect & Fix Stuck Integration Runs',
  cronTime: cronGenerator.every(30).minutes(),
  onTrigger: async () => {
    if (!running) {
      running = true
      try {
        const dbOptions = await SequelizeRepository.getDefaultIRepositoryOptions()
        const runsRepo = new IntegrationRunRepository(dbOptions)
        const streamsRepo = new IntegrationStreamRepository(dbOptions)

        const runsToCheck = await runsRepo.findIntegrationsByState([
          IntegrationRunState.PENDING,
          IntegrationRunState.PROCESSING,
        ])

        const now = moment()
        for (const run of runsToCheck) {
          // let's first check if the integration run itself is older than 3 hours
          // we are updating updatedAt at the end of the integration run when we process all streams or if it's stopped by rate limit/delays
          // so it should be a good indicator if the integration run is stuck
          // but because some integrations are really long running it must not be the only one

          const integrationLastUpdatedAt = moment(run.updatedAt)
          const diff = now.diff(integrationLastUpdatedAt, 'hours')

          if (diff >= THRESHOLD_HOURS) {
            const logger = createChildLogger('fixer', log, { runId: run.id })
            log.warn({ runId: run.id }, 'Investigating possible stuck integration run!')

            // first lets check if the we have any integration streams that are in state processing
            // and if we have let's see when were they moved to that state based on updatedAt column
            // if they are older than 3 hours we will reset them to pending state and start integration back up
            const processingStreams = await streamsRepo.findByRunId(
              run.id,
              IntegrationStreamState.PROCESSING,
            )

            let stuck = false

            if (processingStreams.length > 0) {
              sortStreamsFromNewestToOldest(processingStreams)
              const newestStream = processingStreams[0]
              const streamLastUpdatedAt = moment(newestStream.updatedAt)
              const diff = now.diff(streamLastUpdatedAt, 'hours')
              if (diff >= THRESHOLD_HOURS) {
                logger.warn(
                  { streamId: newestStream.id },
                  'Found stuck processing stream! Reseting all processing streams!',
                )
                stuck = true

                for (const stream of processingStreams) {
                  await streamsRepo.reset(stream.id)
                }
              }
            }

            // if there were no processing streams lets check if we have pending streams that are older than 3 hours
            if (!stuck) {
              const pendingStreams = await streamsRepo.findByRunId(
                run.id,
                IntegrationStreamState.PENDING,
              )
              if (pendingStreams.length > 0) {
                sortStreamsFromNewestToOldest(pendingStreams)
                const newestStream = pendingStreams[0]
                const streamLastUpdatedAt = moment(newestStream.updatedAt)
                const diff = now.diff(streamLastUpdatedAt, 'hours')
                if (diff >= THRESHOLD_HOURS) {
                  logger.warn({ streamId: newestStream.id }, 'Found stuck pending stream!')
                  stuck = true
                }
              }
            }

            // and the last check is to see whether we have any errored streams that are older than 3 hours and haven't been retried enough times
            if (!stuck) {
              const errorStreams = await streamsRepo.findByRunId(
                run.id,
                IntegrationStreamState.ERROR,
              )

              const notEnoughRetries = errorStreams.filter(
                (stream) => stream.retries < INTEGRATION_PROCESSING_CONFIG.maxRetries,
              )

              if (notEnoughRetries.length > 0) {
                logger.warn(
                  `Found ${notEnoughRetries.length} errored streams with not enough retries!`,
                )

                sortStreamsFromNewestToOldest(notEnoughRetries)
                const newestStream = notEnoughRetries[0]
                const streamLastUpdatedAt = moment(newestStream.updatedAt)
                const diff = now.diff(streamLastUpdatedAt, 'hours')
                if (diff >= THRESHOLD_HOURS) {
                  logger.warn({ streamId: newestStream.id }, 'Found stuck errored stream!')
                  stuck = true
                }
              }
            }

            // this check tries to see whether the integration run is actually finished but it's in a wrong state
            // by checking all streams and determining whether they are in a final state
            if (!stuck) {
              // check if there are any streams that are not in a final state
              const allStreams = await streamsRepo.findByRunId(run.id)

              const notFinalStreams = allStreams.filter(
                (stream) =>
                  stream.state !== IntegrationStreamState.ERROR &&
                  stream.state !== IntegrationStreamState.PROCESSED,
              )

              if (notFinalStreams.length === 0) {
                logger.warn(
                  'Found no streams in a final state! Setting integration to either error or processed!',
                )

                const state = await runsRepo.touchState(run.id)
                if (
                  state !== IntegrationRunState.ERROR &&
                  state !== IntegrationRunState.PROCESSED
                ) {
                  logger.error('Integration is not in a final state! Requires manual intervention!')
                }
              }
            }

            if (stuck) {
              logger.warn('Delaying integration for 1 second to restart it!')
              const delayUntil = moment().add(1, 'second').toDate()
              await runsRepo.delay(run.id, delayUntil)
            }
          }
        }
      } finally {
        running = false
      }
    }
  },
}

export default job
