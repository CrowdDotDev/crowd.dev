import { Sequelize } from 'sequelize/types'
import { QueryTypes } from 'sequelize'

import { API_CONFIG, SAMPLE_DATA_CONFIG } from '../../../../config'

const sequelize = new Sequelize(/* your sequelize configuration */)

async function refreshSampleDataWorker(): Promise<void> {
  if (API_CONFIG.edition === 'crowd-hosted') {
    const tenantId = SAMPLE_DATA_CONFIG.tenantId
    const updateDays = 1 // Or any number of days you want to add

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
        SET ${column} = ${column} + INTERVAL '${updateDays} days'
        WHERE tenantId = ${tenantId};
      `

        await sequelize.query(query, { type: QueryTypes.UPDATE })
      }
    }
  }
}

export { refreshSampleDataWorker }
