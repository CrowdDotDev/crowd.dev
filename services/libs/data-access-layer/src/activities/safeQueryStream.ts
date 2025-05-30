import QueryStream from 'pg-query-stream'

import { DbConnOrTx } from '@crowd/database'

export interface QueryStreamOptions {
  batchSize?: number
  highWaterMark?: number
  queryTimeout?: number
}

/**
 * Safe wrapper for `pg-query-stream` to prevent `TypeError: queryCallback is not a function`
 * when using `query_timeout` with streaming queries.
 *
 * node-postgres expects a `.callback` method on all query objects, which `pg-query-stream`
 * lacks. This monkey-patch injects a no-op `callback` and overrides internal handlers to
 * clear timeouts safely once data starts flowing or the query completes.
 *
 * @see https://github.com/brianc/node-postgres/issues/1860#issuecomment-489582161
 */
function safeQueryStream(
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

/**
 * Async generator for streaming large query results with sane defaults.
 * Wraps `safeQueryStream` and supports custom stream options.
 */
export async function* queryStreamIter<T>(
  db: DbConnOrTx,
  sql: string,
  params: unknown[],
  opts?: QueryStreamOptions,
): AsyncIterable<T> {
  const stream = await new Promise<QueryStream>((resolve, reject) => {
    // Flag to prevent multiple rejections/resolutions
    let streamReleased = false

    const safeReject = (err: Error) => {
      if (!streamReleased) {
        streamReleased = true
        reject(err)
      }
    }

    const safeResolve = (s: QueryStream) => {
      if (!streamReleased) {
        streamReleased = true
        resolve(s)
      }
    }

    try {
      // pg-promise's db.stream(qs, initCb)
      // initCb is called with the QueryStream object when pg starts streaming
      // db.stream ALSO returns a Promise that resolves/rejects based on the stream's lifecycle
      const dbStreamPromise = safeQueryStream(
        // safeQueryStream returns the promise from db.stream
        db,
        sql,
        params,
        (streamObj: QueryStream) => {
          // This is the initCb for db.stream
          // Attach error handler to the QueryStream instance itself
          // This should catch errors like 'Query read timeout' emitted by the stream
          streamObj.on('error', (err) => {
            safeReject(err)
          })
          // If no error during init, resolve Promise A with the stream
          safeResolve(streamObj)
        },
        {
          batchSize: 1000,
          highWaterMark: 250,
          ...opts,
        },
      )

      // Handle rejection of the promise returned by db.stream itself
      // This covers cases where db.stream might fail before initCb is called,
      // or if the stream finishes with an error state that pg-promise handles.
      if (dbStreamPromise && typeof dbStreamPromise.catch === 'function') {
        dbStreamPromise.catch((err) => {
          safeReject(err)
        })
      }
    } catch (syncError) {
      // Catch synchronous errors from calling safeQueryStream
      safeReject(syncError)
    }
  })

  yield* stream as AsyncIterable<T>
}
