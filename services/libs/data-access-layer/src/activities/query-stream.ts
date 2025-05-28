import QueryStream from 'pg-query-stream'

import { DbConnOrTx } from '@crowd/database'

export interface QueryStreamOptions {
  batchSize?: number
  highWaterMark?: number
  queryTimeout?: number
}

// Wrapper for pg-query-stream to manage errors and timeouts gracefully.
// Monkey-patch based on https://github.com/brianc/node-postgres/issues/1860#issuecomment-489582161
export function dbQueryStream(
  db: DbConnOrTx,
  sql: string,
  params: unknown[],
  initCb: (stream: QueryStream) => void,
  opts?: QueryStreamOptions,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qs = new QueryStream(sql, params, opts) as any

  // FYI: If `query_timeout` is defined on the Client, it's impossible to
  // disable the query_timeout by setting to undefined, or 0,
  // which would negate the need for the hackiness that follows.
  qs.query_timeout = opts && opts.queryTimeout

  // Work around a bug in node-postgres -- not all Query objects have
  // a `callback` method, but node-postgres is expecting it to exist.
  // If it doesn't exist, then query_timeouts will start causing things
  // to blow up.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment
  // @ts-ignore-error
  qs.callback = () => undefined

  // The following treats treats a read-timeout as time-to-first-data-result on
  // query streams, rather than time to complete processing
  const oldHandleDataRow = qs.handleDataRow
  qs.handleDataRow = function (...args: unknown[]) {
    this.callback() // kills the readdb timeout
    this.handleDataRow = oldHandleDataRow
    oldHandleDataRow.apply(this, args)
  }

  // We have to patch this method too if the result is 0 rows, otherwise
  // the read timeout on an older query can cancel the current active query
  const oldHandleReadyForQuery = qs.handleReadyForQuery
  qs.handleReadyForQuery = function (...args: unknown[]) {
    this.callback() // kills the read timeout
    this.handleReadyForQuery = oldHandleReadyForQuery
    oldHandleReadyForQuery.apply(this, args)
  }

  return db.stream(qs, initCb)
}

export async function* queryStreamIter<T>(
  db: DbConnOrTx,
  sql: string,
  params: unknown[],
  opts: QueryStreamOptions,
): AsyncIterable<T> {
  const stream = await new Promise((resolve) => {
    dbQueryStream(db, sql, params, resolve, opts)
  })

  yield* stream as AsyncIterable<T>
}
