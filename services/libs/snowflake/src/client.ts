/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto'
import Snowflake from 'snowflake-sdk'

import { Logger, getChildLogger } from '@crowd/logging'

export class SnowflakeClient {
  private pool: Snowflake.Pool<Snowflake.Connection>
  private log: Logger

  constructor({
    privateKeyString,
    account,
    username,
    database,
    warehouse,
    privateKeyPassphrase,
    role,
    maxConnections = 5,
    minConnections = 1,
    parentLog,
  }: {
    privateKeyString: string | Buffer
    account: string
    username: string
    database: string
    warehouse: string
    privateKeyPassphrase?: string
    role?: string
    maxConnections?: number
    minConnections?: number
    parentLog: Logger
  }) {
    this.log = getChildLogger('SnowflakeClient', parentLog)

    let privateKey: string | Buffer
    try {
      const formattedKey = privateKeyString.includes('BEGIN PRIVATE KEY')
        ? privateKeyString
        : `-----BEGIN PRIVATE KEY-----\n${privateKeyString}\n-----END PRIVATE KEY-----`

      const privateKeyObject = crypto.createPrivateKey({
        key: formattedKey,
        format: 'pem',
        ...(privateKeyPassphrase && { passphrase: privateKeyPassphrase }),
      })

      privateKey = privateKeyObject.export({
        format: 'pem',
        type: 'pkcs8',
      })
    } catch (err) {
      throw new Error('Invalid private key format')
    }

    this.log.info(
      {
        account,
        database,
        warehouse,
        username,
        maxConnections,
        minConnections,
      },
      'Initializing Snowflake connection pool',
    )
    this.pool = Snowflake.createPool(
      {
        account,
        username,
        privateKey: privateKey.toString(),
        database,
        warehouse,
        role,
        authenticator: 'SNOWFLAKE_JWT',
      },
      {
        evictionRunIntervalMillis: 60000, // default = 0, off
        idleTimeoutMillis: 60000, // default = 30000
        max: maxConnections,
        min: minConnections,
      },
    )
  }

  private async executeQuery(
    connection: Snowflake.Connection,
    query: string,
    binds?: any[],
  ): Promise<any[]> {
    return new Promise((resolve, reject) => {
      connection.execute({
        sqlText: query,
        binds: binds,
        complete: (err, stmt, rows) => {
          if (err) {
            reject(err)
          } else {
            resolve(rows)
          }
        },
      })
    })
  }

  public async run<T>(query: string, binds?: any[]): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.pool.use(async (connection) => {
        try {
          this.log.info(
            {
              query,
              binds,
              hasBinds: !!binds,
            },
            'Executing Snowflake query',
          )
          const results = await this.executeQuery(connection, query, binds)

          this.log.info(
            {
              query,
              resultCount: results.length,
            },
            'Successfully executed Snowflake query',
          )
          resolve(results)
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  public static fromEnv(extraConfig: any = {}) {
    return new SnowflakeClient({
      privateKeyString: process.env.CROWD_SNOWFLAKE_PRIVATE_KEY,
      account: process.env.CROWD_SNOWFLAKE_ACCOUNT,
      username: process.env.CROWD_SNOWFLAKE_USERNAME,
      database: process.env.CROWD_SNOWFLAKE_DATABASE,
      warehouse: process.env.CROWD_SNOWFLAKE_WAREHOUSE,
      role: process.env.CROWD_SNOWFLAKE_ROLE,
      maxConnections: 1,
      ...extraConfig,
    })
  }
}
