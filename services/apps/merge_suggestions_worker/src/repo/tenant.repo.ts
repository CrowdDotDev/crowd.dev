import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { ITenantId } from 'types'

class TenantRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
  ) {}

  async getAllTenants(): Promise<ITenantId[]> {
    let rows: ITenantId[] = []
    try {
      rows = await this.connection.query(`
        SELECT id as "tenantId"
        FROM tenants WHERE "deletedAt" IS NULL;
      `)
    } catch (err) {
      this.log.error('Error while getting all tenants', err)

      throw new Error(err)
    }

    return rows
  }
}

export default TenantRepository
