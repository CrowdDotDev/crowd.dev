/* eslint-disable @typescript-eslint/no-explicit-any */
import crypto from 'crypto'
import Snowflake from 'snowflake-sdk'

import { getServiceChildLogger } from '@crowd/logging'

const logger = getServiceChildLogger('snowflake')

export class SnowflakeClient {
  private pool: Snowflake.Pool<Snowflake.Connection>
  private connectionOptions: Snowflake.ConnectionOptions
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
  }) {
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

    this.connectionOptions = {
      account,
      username,
      privateKey: privateKey.toString(),
      database,
      warehouse,
      role,
      authenticator: 'SNOWFLAKE_JWT',
    }

    this.pool = Snowflake.createPool(this.connectionOptions, {
      evictionRunIntervalMillis: 60000, // default = 0, off
      idleTimeoutMillis: 60000, // default = 30000
      max: maxConnections,
      min: minConnections,
    })
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
          const results = await this.executeQuery(connection, query, binds)
          resolve(results)
        } catch (err) {
          reject(err)
        }
      })
    })
  }

  private async connect(): Promise<Snowflake.Connection> {
    return new Promise((resolve, reject) => {
      const connection: Snowflake.Connection = Snowflake.createConnection({
        ...this.connectionOptions,
        streamResult: true,
      })
      connection.connect((err, conn) => {
        if (err) {
          logger.error('error connecting to snowflake', err)
          reject(err)
        } else {
          logger.info('snowflake connection established')
          resolve(conn)
        }
      })
    })
  }

  private async disconnect(connection: Snowflake.Connection): Promise<void> {
    if (connection) {
      return new Promise((resolve, reject) => {
        connection.destroy((err, conn) => {
          if (err) {
            logger.error('error destroying snowflake connection', err)
            reject(err)
          } else {
            logger.info('snowflake connection destroyed')
            resolve()
          }
        })
      })
    }
  }

  private async withStreamingConnection(cb: (connection: Snowflake.Connection) => Promise<void>) {
    let connection: Snowflake.Connection
    try {
      connection = await this.connect()
      await cb(connection)
    } finally {
      await this.disconnect(connection)
    }
  }

  private async streamQuery(
    connection: Snowflake.Connection,
    query: string,
    binds: any[],
    onRow: (row: any) => void,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      connection.execute({
        sqlText: query,
        binds: binds,
        streamResult: true,
        complete: (err, stmt) => {
          if (err) {
            logger.error('error executing snowflake query', err)
            reject(err)
            return
          }

          const stream = stmt.streamRows()
          // Read data from the stream when it is available
          stream
            .on('readable', function (row) {
              while ((row = this.read()) !== null) {
                onRow(row)
              }
            })
            .on('end', function () {
              logger.info('done')
              resolve()
            })
            .on('error', function (err) {
              logger.error('error streaming snowflake query', err)
              reject(err)
            })
        },
      })
    })
  }

  public async stream(query: string, binds: any[], onRow: (row: any) => void): Promise<void> {
    await this.withStreamingConnection(async (connection) => {
      await this.streamQuery(connection, query, binds, onRow)
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
