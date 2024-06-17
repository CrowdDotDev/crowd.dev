import { DbTransaction, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import { DB_CONFIG } from '../conf'

const log = getServiceLogger()

setImmediate(async () => {
  log.info('Loading data from csv file...')
  const data = await fs.readFileSync('data.csv', 'utf8')
  const records = parse(data, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter: ',',
  })

  const dbConnection = await getDbConnection(DB_CONFIG())

  for (const record of records) {
    const accountName = record['ACCOUNT_NAME']
    log.info({ accountName }, 'Processing record...')

    await dbConnection.tx(async (conn) => {
      const organizationId = await findOrganizationId(conn, accountName)

      if (organizationId) {
        log.info({ accountName, organizationId }, 'Organization found!')
      } else {
        log.warn({ accountName }, 'Organization not found!')
      }
    })
  }

  process.exit(0)
})

const findOrganizationId = async (
  conn: DbTransaction,
  accountName: string,
): Promise<string | null> => {
  const query = `
    select "organizationId"
    from "lfxMemberships"
    where "accountName" = $(accountName)
    limit 1
  `

  const result = await conn.oneOrNone(query, { accountName })

  if (!result) {
    return null
  }

  return result.organizationId
}
