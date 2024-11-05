import crypto from 'crypto'
import Snowflake from 'snowflake-sdk'

export class SnowflakeClient {
  private pool: Snowflake.Pool<Snowflake.Connection>

  constructor({
    privateKeyString,
    account,
    username,
    database,
    warehouse,
    privateKeyPassphrase,
    maxConnections = 5,
    minConnections = 1,
  }: {
    privateKeyString: string | Buffer
    account: string
    username: string
    database: string
    warehouse: string
    privateKeyPassphrase?: string
    maxConnections?: number
    minConnections?: number
  }) {
    const privateKeyObject = crypto.createPrivateKey({
      key: privateKeyString,
      format: 'pem',
      ...(privateKeyPassphrase && { passphrase: privateKeyPassphrase }),
    })

    const privateKey = privateKeyObject.export({
      format: 'pem',
      type: 'pkcs8',
    })

    this.pool = Snowflake.createPool(
      {
        account,
        username,
        privateKey: privateKey.toString(),
        database,
        warehouse,
        authenticator: 'SNOWFLAKE_JWT',
      },
      {
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
          const results = await this.executeQuery(connection, query, binds)
          resolve(results)
        } catch (err) {
          reject(err)
        }
      })
    })
  }
}
