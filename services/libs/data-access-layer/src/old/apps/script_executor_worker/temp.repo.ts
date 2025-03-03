import { DbConnection, DbTransaction } from '@crowd/database'

class TempRepository {
  constructor(private readonly connection: DbConnection | DbTransaction) {}

  async markMemberOrgAffiliationAsProcessed(
    memberId: string,
    organizationId: string,
  ): Promise<void> {
    await this.connection.none(
      `insert into "processedMemberOrgAffiliations" ("memberId", "organizationId") values ($(memberId), $(organizationId))`,
      {
        memberId,
        organizationId,
      },
    )
  }
}

export default TempRepository
