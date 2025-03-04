import https from 'https'
import pgpromise from 'pg-promise'

import { IS_PROD_ENV } from '@crowd/common'
import { getServiceChildLogger } from '@crowd/logging'
import telemetry from '@crowd/telemetry'

const log = getServiceChildLogger('questdb.sql.connection')

let client: pgpromise.IDatabase<unknown> | undefined

function fetchJson(url, timeoutMs = 3600000) {
  // Default 1 hour timeout
  return new Promise((resolve, reject) => {
    const req = https
      .get(url, (res) => {
        let data = ''

        // A chunk of data has been received
        res.on('data', (chunk) => {
          data += chunk
        })

        // The whole response has been received
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data)
            resolve(jsonData)
          } catch (e) {
            reject(e)
          }
        })
      })
      .on('error', (err) => {
        reject(err)
      })
      .on('timeout', () => {
        req.destroy()
        reject(new Error(`Request timed out after ${timeoutMs}ms`))
      })

    // Set the timeout (use 0 to disable timeout completely)
    req.setTimeout(timeoutMs)
  })
}

export const executeHTTPQuery = async (query: string, params?: any): Promise<unknown> => {
  let formattedQuery = query
  if (params) {
    formattedQuery = pgpromise.as.format(query, params)
  }

  const url = `https://${process.env.CROWD_QUESTDB_SQL_HOST}/exec?query=${encodeURIComponent(formattedQuery)}&timings=true`
  return fetchJson(url)
}

export const getClientSQL = async (): Promise<pgpromise.IDatabase<unknown>> => {
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
  })

  const profile = process.env['CROWD_QUESTDB_PROFILE_QUERIES'] !== undefined
  // milliseconds
  const minQueryDuration = Number(
    process.env['CROWD_QUESTDB_PROFILE_QUERIES_MIN_DURATION'] || 30000,
  )

  const oldQuery = client.query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(client as any).query = async (query, values, ...args) => {
    const timer = telemetry.timer('questdb.query_duration')
    try {
      const result = await oldQuery.apply(client, [query, values, ...args])
      return result
    } finally {
      // milliseconds
      const duration = timer.stop()
      const seconds = duration / 1000.0

      if (profile || duration >= minQueryDuration) {
        log.warn({ durationSeconds: seconds, query, values }, 'QuestDB query duration profiling!')
      }
    }
  }

  return client
}
