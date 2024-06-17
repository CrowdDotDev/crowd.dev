import { DbTransaction, getDbConnection } from '@crowd/data-access-layer/src/database'
import { getServiceLogger } from '@crowd/logging'
import { parse } from 'csv-parse/sync'
import fs from 'fs'
import { DB_CONFIG } from '../conf'

const log = getServiceLogger()

const stats = new Map<string, number>()

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
        stats.set(Stat.ORG_FOUND, (stats.get(Stat.ORG_FOUND) || 0) + 1)
      } else {
        log.warn({ accountName }, 'Organization not found!')
        stats.set(Stat.ORG_NOT_FOUND, (stats.get(Stat.ORG_FOUND) || 0) + 1)
      }
    })
  }

  for (const [stat, count] of stats) {
    log.info({ stat, count }, 'Summary')
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

enum Stat {
  ORG_FOUND = 'ORG_FOUND',
  ORG_NOT_FOUND = 'ORG_NOT_FOUND',
}
