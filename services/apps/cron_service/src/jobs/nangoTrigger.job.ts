import CronTime from 'cron-time-generator'

import { ConcurrencyLimiter, IS_DEV_ENV } from '@crowd/common'
import { READ_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { fetchNangoIntegrationDataForCheck } from '@crowd/data-access-layer/src/integrations'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import {
  ALL_NANGO_INTEGRATIONS,
  INangoWebhookPayload,
  NANGO_INTEGRATION_CONFIG,
  NangoIntegration,
  nangoIntegrationToPlatform,
  platformToNangoIntegration,
} from '@crowd/nango'
import { TEMPORAL_CONFIG, WorkflowIdReusePolicy, getTemporalClient } from '@crowd/temporal'
import { PlatformType } from '@crowd/types'

import { IJobDefinition } from '../types'

// How old an integration must be before we reduce its check frequency
const AGE_THRESHOLD_MS = IS_DEV_ENV
  ? 20 * 60 * 1000 // 20 minutes for local testing
  : 30 * 24 * 60 * 60 * 1000 // 1 month

// How often the cron runs (used to determine if old integrations should be triggered this run)
const OLD_INTEGRATION_INTERVAL_HOURS = IS_DEV_ENV ? 0 : 6
const OLD_INTEGRATION_INTERVAL_MINUTES = IS_DEV_ENV ? 15 : 0

function shouldTriggerOldIntegrations(now: Date): boolean {
  if (IS_DEV_ENV) {
    return now.getMinutes() % OLD_INTEGRATION_INTERVAL_MINUTES === 0
  }
  return now.getHours() % OLD_INTEGRATION_INTERVAL_HOURS === 0
}

const job: IJobDefinition = {
  name: 'nango-trigger',
  cronTime: IS_DEV_ENV ? CronTime.every(5).minutes() : CronTime.everyHour(),
  timeout: 4 * 60 * 60, // 4 hours
  process: async (ctx) => {
    ctx.log.info('Triggering nango API check as if a webhook was received!')

    const temporal = await getTemporalClient(TEMPORAL_CONFIG())

    const dbConnection = await getDbConnection(READ_DB_CONFIG(), 3, 0)

    const allIntegrations = await fetchNangoIntegrationDataForCheck(pgpQx(dbConnection), [
      ...new Set(ALL_NANGO_INTEGRATIONS.map(nangoIntegrationToPlatform)),
    ])

    const now = new Date()
    const triggerOld = shouldTriggerOldIntegrations(now)

    const integrationsToTrigger = allIntegrations.filter((int) => {
      const ageMs = now.getTime() - new Date(int.createdAt).getTime()
      const isOld = ageMs >= AGE_THRESHOLD_MS
      return !isOld || triggerOld
    })

    ctx.log.info(
      `Total integrations: ${allIntegrations.length}, triggering: ${integrationsToTrigger.length} (old integrations ${triggerOld ? 'included' : 'skipped'})`,
    )

    const limiter = new ConcurrencyLimiter(5)

    // Collect all workflow start operations
    const workflowStarts: Array<() => Promise<void>> = []

    for (let i = 0; i < integrationsToTrigger.length; i++) {
      const int = integrationsToTrigger[i]

      const { id, settings } = int

      ctx.log.info(
        `${i + 1}/${integrationsToTrigger.length} Triggering nango integration check for ${id} (${int.platform})`,
      )

      const platform = platformToNangoIntegration(int.platform as PlatformType, settings)

      if (platform === NangoIntegration.GITHUB && !settings.nangoMapping) {
        // ignore non-nango github integrations
        continue
      }

      for (const model of Object.values(NANGO_INTEGRATION_CONFIG[platform].models)) {
        ctx.log.debug(
          {
            integrationId: id,
            platform,
            model,
          },
          'Triggering nango integration check!',
        )

        if (platform === NangoIntegration.GITHUB) {
          // trigger for each connection id - could be multiple because 1 integration can have multiple repositories and each repository has a connection id on nango
          for (const connectionId of Object.keys(settings.nangoMapping)) {
            const payload: INangoWebhookPayload = {
              connectionId: connectionId,
              providerConfigKey: platform,
              syncName: 'not important',
              model,
              responseResults: { added: 1, updated: 1, deleted: 1 },
              syncType: 'INCREMENTAL',
              modifiedAfter: new Date().toISOString(),
            }

            workflowStarts.push(async () => {
              try {
                await temporal.workflow.start('processNangoWebhook', {
                  taskQueue: 'nango',
                  workflowId: `nango-webhook/${platform}/${id}/${connectionId}/${model}/cron-triggered`,
                  workflowIdReusePolicy:
                    WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
                  retry: {
                    maximumAttempts: 10,
                  },
                  args: [payload],
                })
              } catch (error) {
                if (error.name === 'WorkflowExecutionAlreadyStartedError') {
                  ctx.log.debug(
                    {
                      integrationId: id,
                      platform,
                      model,
                      connectionId,
                    },
                    'Workflow already running, skipping...',
                  )
                  return
                }
                throw error
              }
            })
          }
        } else {
          const payload: INangoWebhookPayload = {
            connectionId: id,
            providerConfigKey: platform,
            syncName: 'not important',
            model,
            responseResults: { added: 1, updated: 1, deleted: 1 },
            syncType: 'INCREMENTAL',
            modifiedAfter: new Date().toISOString(),
          }

          workflowStarts.push(async () => {
            try {
              await temporal.workflow.start('processNangoWebhook', {
                taskQueue: 'nango',
                workflowId: `nango-webhook/${platform}/${id}/${model}/cron-triggered`,
                workflowIdReusePolicy:
                  WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE,
                retry: {
                  maximumAttempts: 10,
                },
                args: [payload],
              })
            } catch (error) {
              if (error.name === 'WorkflowExecutionAlreadyStartedError') {
                ctx.log.debug(
                  {
                    integrationId: id,
                    platform,
                    model,
                  },
                  'Workflow already running, skipping...',
                )
                return
              }
              throw error
            }
          })
        }
      }
    }

    ctx.log.info(`Triggering nango integration checks with ${workflowStarts.length} workflows!`)

    // Track completed workflows
    let completedWorkflows = 0

    // Register callback to track completed workflows
    limiter.setOnJobComplete(() => {
      completedWorkflows++
      if (completedWorkflows % 100 === 0) {
        ctx.log.info(`Triggered ${completedWorkflows} nango integrations checks so far...`)
      }
    })

    // Process all workflow starts with concurrency limit
    for (const workflowStart of workflowStarts) {
      await limiter.schedule(workflowStart)
    }

    // Wait for all remaining jobs to complete
    await limiter.waitForFinish()

    ctx.log.info(`Triggered ${completedWorkflows} nango integrations checks in total`)
  },
}

export default job
