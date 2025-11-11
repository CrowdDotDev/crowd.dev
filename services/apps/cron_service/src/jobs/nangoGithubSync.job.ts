import CronTime from 'cron-time-generator'

import { IS_DEV_ENV } from '@crowd/common'
import { READ_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'
import { fetchNangoIntegrationData } from '@crowd/data-access-layer/src/integrations'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { NangoIntegration, nangoIntegrationToPlatform } from '@crowd/nango'
import { TEMPORAL_CONFIG, WorkflowIdReusePolicy, getTemporalClient } from '@crowd/temporal'
import { PlatformType } from '@crowd/types'

import { IJobDefinition } from '../types'

const job: IJobDefinition = {
  name: 'nango-github-sync',
  cronTime: CronTime.every(
    Number(process.env.CROWD_GH_NANGO_SYNC_INTERVAL_MINUTES || IS_DEV_ENV ? 5 : 60),
  ).minutes(),
  timeout: 10 * 60,
  process: async (ctx) => {
    ctx.log.info('Triggering nango API check as if a webhook was received!')

    const temporal = await getTemporalClient(TEMPORAL_CONFIG())

    const dbConnection = await getDbConnection(READ_DB_CONFIG(), 3, 0)

    const integrations = await fetchNangoIntegrationData(pgpQx(dbConnection), [
      nangoIntegrationToPlatform(NangoIntegration.GITHUB),
    ])

    const ids: string[] = []

    for (const int of integrations) {
      const { id, platform } = int

      if (platform !== PlatformType.GITHUB_NANGO) {
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
