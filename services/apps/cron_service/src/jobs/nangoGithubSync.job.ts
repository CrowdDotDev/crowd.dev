import CronTime from 'cron-time-generator'

import { READ_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { fetchNangoIntegrationData } from '@crowd/data-access-layer/src/integrations'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { NangoIntegration, nangoIntegrationToPlatform } from '@crowd/nango'
import { TEMPORAL_CONFIG, WorkflowIdReusePolicy, getTemporalClient } from '@crowd/temporal'

import { IJobDefinition } from '../types'

const job: IJobDefinition = {
  name: 'nango-github-sync',
  cronTime: CronTime.every(2).hours(),
  timeout: 5 * 60,
  process: async (ctx) => {
    ctx.log.info('Triggering nango API check as if a webhook was received!')

    const temporal = await getTemporalClient(TEMPORAL_CONFIG())

    const dbConnection = await getDbConnection(READ_DB_CONFIG(), 3, 0)

    const integrations = await fetchNangoIntegrationData(pgpQx(dbConnection), [
      nangoIntegrationToPlatform(NangoIntegration.GITHUB),
    ])

    const ids: string[] = []

    for (const int of integrations) {
      const { id, settings } = int

      if (!settings.nangoMapping) {
        // ignore non-nango github integrations
        continue
      }

      ctx.log.info(
        {
          integrationId: id,
        },
        'Triggering nango github integration sync!',
      )

      ids.push(id)
    }

    await temporal.workflow.start('syncGithubIntegration', {
      taskQueue: 'nango',
      workflowId: `github-nango-sync/cron/${new Date().toISOString()}`,
      workflowIdReusePolicy:
        WorkflowIdReusePolicy.WORKFLOW_ID_REUSE_POLICY_ALLOW_DUPLICATE_FAILED_ONLY,
      retry: {
        maximumAttempts: 10,
      },
      args: [{ integrationIds: ids }],
    })
  },
}

export default job
