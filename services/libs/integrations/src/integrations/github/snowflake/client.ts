import Snowflake from 'snowflake-sdk'

export class SnowflakeClient {
  private pool: Snowflake.Pool<Snowflake.Connection>

  constructor() {
    this.pool = Snowflake.createPool(
      {
        account: process.env.SNOWFLAKE_ACCOUNT,
        username: process.env.SNOWFLAKE_USERNAME,
        password: process.env.SNOWFLAKE_PASSWORD,
        database: process.env.SNOWFLAKE_DATABASE,
        warehouse: process.env.SNOWFLAKE_WAREHOUSE,
      },
      {
        max: 10, // Maximum number of connections in pool
        min: 1, // Minimum number of connections in pool
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

  public async run(query: string, binds?: any[]): Promise<any[]> {
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
