import cronGenerator from 'cron-time-generator'
import moment from 'moment'
import { createChildLogger, createServiceChildLogger } from '../../utils/logging'
import IntegrationRunRepository from '../../database/repositories/integrationRunRepository'
import IntegrationStreamRepository from '../../database/repositories/integrationStreamRepository'
import SequelizeRepository from '../../database/repositories/sequelizeRepository'
import { IntegrationStreamState } from '../../types/integrationStreamTypes'
import { CrowdJob } from '../../types/jobTypes'
import { IntegrationRunState } from '../../types/integrationRunTypes'
import { INTEGRATION_PROCESSING_CONFIG } from '../../config'

const log = createServiceChildLogger('checkStuckIntegrationRuns')

const THRESHOLD_HOURS = 3

let running = false

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
          const integrationLastUpdatedAt = moment(run.updatedAt)
          const diff = now.diff(integrationLastUpdatedAt, 'hours')

          if (diff >= THRESHOLD_HOURS) {
            const logger = createChildLogger('fixer', log, { runId: run.id })
            log.warn({ runId: run.id }, 'Investigating possible stuck integration run!')

            const processingStreams = await streamsRepo.findByRunId(
              run.id,
              IntegrationStreamState.PROCESSING,
            )

            let stuck = false

            if (processingStreams.length > 0) {
              // find the newest one by updatedAt
              processingStreams.sort((a, b) => {
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

            if (!stuck) {
              const pendingStreams = await streamsRepo.findByRunId(
                run.id,
                IntegrationStreamState.PENDING,
              )
              if (pendingStreams.length > 0) {
                // find the newest one by updatedAt
                pendingStreams.sort((a, b) => {
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

                const newestStream = pendingStreams[0]
                const streamLastUpdatedAt = moment(newestStream.updatedAt)
                const diff = now.diff(streamLastUpdatedAt, 'hours')
                if (diff >= THRESHOLD_HOURS) {
                  logger.warn({ streamId: newestStream.id }, 'Found stuck pending stream!')
                  stuck = true
                }
              }
            }

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
                stuck = true
              }
            }

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
