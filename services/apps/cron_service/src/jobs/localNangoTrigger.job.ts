import CronTime from 'cron-time-generator'

import { IS_DEV_ENV } from '@crowd/common'
import { READ_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { fetchIntegrationDataForNangoTriggering } from '@crowd/data-access-layer/src/integrations'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import {
  ALL_NANGO_INTEGRATIONS,
  INangoWebhookPayload,
  NANGO_INTEGRATION_CONFIG,
  NangoIntegration,
} from '@crowd/nango'
import { TEMPORAL_CONFIG, WorkflowIdReusePolicy, getTemporalClient } from '@crowd/temporal'

import { IJobDefinition } from '../types'

const job: IJobDefinition = {
  name: 'local-nango-trigger',
  cronTime: CronTime.everyMinute(),
  timeout: 5 * 60,
  process: async (ctx) => {
    if (IS_DEV_ENV) {
      ctx.log.info('Triggering nango API check as if a webhook was received!')

      const temporal = await getTemporalClient(TEMPORAL_CONFIG())

      const dbConnection = await getDbConnection(READ_DB_CONFIG(), 3, 0)

      const integrationsToTrigger = await fetchIntegrationDataForNangoTriggering(
        pgpQx(dbConnection),
        ALL_NANGO_INTEGRATIONS,
      )

      for (const int of integrationsToTrigger) {
        const { id, platform } = int

        for (const model of Object.values(
          NANGO_INTEGRATION_CONFIG[platform as NangoIntegration].models,
        )) {
          ctx.log.info(
            {
              integrationId: id,
              platform,
              model,
            },
            'Triggering nango integration check!',
          )

          const payload: INangoWebhookPayload = {
            connectionId: id,
            providerConfigKey: platform,
            syncName: 'not important',
            model,
            responseResults: { added: 1, updated: 1, deleted: 1 },
            syncType: 'INCREMENTAL',
            modifiedAfter: new Date().toISOString(),
          }
          await temporal.workflow.start('processNangoWebhook', {
            taskQueue: 'nango',
            workflowId: `nango-webhook/${platform}/${id}/${model}`,
            workflowIdReusePolicy:
              WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_TERMINATE_IF_RUNNING,
            retry: {
              maximumAttempts: 10,
            },
            args: [payload],
          })
        }
      }
    }
  },
}

export default job
