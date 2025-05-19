import axios from 'axios'
import pgpromise from 'pg-promise'

import { IS_PROD_ENV } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import telemetry from '@crowd/telemetry'

const log = getServiceChildLogger('questdb.sql.connection')

let client: pgpromise.IDatabase<unknown> | undefined

export const queryOverHttp = async <T>(query: string): Promise<T[]> => {
  try {
    const response = await axios.get(`https://${process.env.CROWD_QUESTDB_ILP_HOST}/exec`, {
      params: {
        query,
        timings: true,
      },
      auth: {
        username: process.env.CROWD_QUESTDB_SQL_USERNAME,
        password: process.env.CROWD_QUESTDB_SQL_PASSWORD,
      },
    })

    const rows: T[] = []
    const columns = response.data.columns.map((c) => c.name)

    for (const row of response.data.dataset) {
      const res: T = {} as T
      for (let i = 0; i < row.length; i++) {
        res[columns[i]] = row[i]
      }

      rows.push(res)
    }

    return rows
  } catch (err) {
    log.error(err, 'Error executing a QuestDB HTTP query!')
    throw err
  }
}

export const getClientSQL = async (
  profileQueries?: boolean,
): Promise<pgpromise.IDatabase<unknown>> => {
  if (client) {
    return client
  }

  log.info('Creating QuestDB client (SQL) instance!')

  client = pgpromise({
    // tslint:disable-next-line:max-line-length
    // see https://stackoverflow.com/questions/36120435/verify-database-connection-with-pg-promise-when-starting-an-app
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async error(err: any, e: pgpromise.IEventContext): Promise<void> {
      if (e.cn) {
        telemetry.increment('questdb.connection_error', 1)
        telemetry.flush()
        log.fatal(err, { cn: e.cn }, 'QuestDB connection error. Stopping process')
        // logs don't have flush:
        await new Promise((resolve) => setTimeout(resolve, 100))
        process.nextTick(() => process.exit())
      }

      if (e.query) {
        telemetry.increment('questdb.query_error', 1)
        log.error(err, { query: e.query, params: e.params }, 'Error executing a QuestDB query!')
      }
    },
    query(e) {
      telemetry.increment('questdb.executed_query', 1)
      log.debug({ query: e.query, params: e.params }, 'Executing QuestDB query')
    },
  })({
    host: process.env['CROWD_QUESTDB_SQL_HOST'],
    port: Number(process.env['CROWD_QUESTDB_SQL_PORT']),
    user: process.env['CROWD_QUESTDB_SQL_USERNAME'],
    password: process.env['CROWD_QUESTDB_SQL_PASSWORD'],
    database: process.env['CROWD_QUESTDB_SQL_DATABASE'],
    application_name: process.env.SERVICE || 'unknown-app',
    ssl: IS_PROD_ENV ? true : false,
    idleTimeoutMillis: 120000,
    max: 4,
    query_timeout: Number(process.env['CROWD_QUESTDB_SQL_QUERY_TIMEOUT'] || 60000),
  })

  const profile = profileQueries || process.env['CROWD_QUESTDB_PROFILE_QUERIES'] !== undefined
  const minQueryDuration = Number(process.env['CROWD_QUESTDB_PROFILE_QUERIES_MIN_DURATION'] || 0)

  const oldQuery = client.query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(client as any).query = async (query, options, ...args) => {
    // milliseconds
    const timer = telemetry.timer('questdb.query_duration')
    try {
      const result = await oldQuery.apply(client, [query, options, ...args])
      return result
    } finally {
      const duration = timer.stop()
      if (profile && duration >= minQueryDuration) {
        const durationSeconds = duration / 1000.0
        log.warn(
          { durationSeconds: durationSeconds.toFixed(2), query, values: options },
          'QuestDB query duration profiling!',
        )
      }
    }
  }

  return client
}
