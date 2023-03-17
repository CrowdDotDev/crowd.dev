import { QueryTypes } from 'sequelize'
import { API_CONFIG, SAMPLE_DATA_CONFIG } from '../../../../config'
import getUserContext from '../../../../database/utils/getUserContext'

async function refreshSampleDataWorker(): Promise<void> {
  // if (API_CONFIG.edition === 'crowd-hosted') {
  const tenantId = SAMPLE_DATA_CONFIG.tenantId
  const userContext = await getUserContext(SAMPLE_DATA_CONFIG.tenantId)
  const updateDays = 1

  const tables = [
    { name: 'activities', columns: ['createdAt', 'timestamp'] },
    { name: 'members', columns: ['joinedAt', 'createdAt'] },
    { name: 'notes', columns: ['createdAt'] },
    { name: 'conversations', columns: ['createdAt'] },
    { name: 'organizations', columns: ['createdAt'] },
    { name: 'tags', columns: ['createdAt'] },
  ]

  for (const table of tables) {
    for (const column of table.columns) {
      const query = `
        UPDATE ${table.name}
        SET "${column}" = "${column}" + INTERVAL '${updateDays} days'
        WHERE "tenantId" = '${tenantId}'; 
      `

      console.log(query)
      await userContext.database.sequelize.query(query, { type: QueryTypes.UPDATE })
    }
  }
  // }
}

export { refreshSampleDataWorker }
