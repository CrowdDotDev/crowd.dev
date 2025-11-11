import CronTime from 'cron-time-generator'

import { IS_PROD_ENV } from '@crowd/common'
import { WRITE_DB_CONFIG, getDbConnection } from '@crowd/data-access-layer/src/database'

import { IJobDefinition } from '../types'

const job: IJobDefinition = {
  name: 'integrations-backup',
  cronTime: CronTime.every(1).days(),
  timeout: 60 * 60, // 1 hour = 60 * 60 seconds
  enabled: async () => IS_PROD_ENV,
  process: async (ctx) => {
    ctx.log.info('Starting integrations backup job!')
    const dbConnection = await getDbConnection(WRITE_DB_CONFIG(), 1, 0)
    await dbConnection.query(`insert into "integrationsBackup" select * from "integrations";`)
    await dbConnection.query(
      `delete from "integrationsBackup" where "backupCreatedAt" < now() - interval '2 months'`,
    )
    ctx.log.info('Integrations backup job completed!')
  },
}

export default job
