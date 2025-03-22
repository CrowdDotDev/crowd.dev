import { DbConnection, DbTransaction } from '@crowd/database'

class TempRepository {
  constructor(private readonly connection: DbConnection | DbTransaction) {}

  async markMemberOrgAffiliationAsProcessed(
    memberId: string,
    organizationId: string,
  ): Promise<void> {
    await this.connection.none(
      `insert into "processedMemberOrgAffiliations" ("memberId", "organizationId") 
       values ($(memberId), $(organizationId))
       ON CONFLICT ("memberId", "organizationId") DO NOTHING`,
      {
        memberId,
        organizationId,
      },
    )
  }

  async getProcessedMemberOrgAffiliations(
    limit: number,
  ): Promise<{ memberId: string; organizationId: string }[]> {
    return this.connection.any(
      `select "memberId", "organizationId" from "processedMemberOrgAffiliations" limit $(limit)`,
      {
        limit,
      },
    )
  }

  async deleteProcessedMemberOrgAffiliations(
    memberId: string,
    organizationId: string,
  ): Promise<void> {
    await this.connection.none(
      `delete from "processedMemberOrgAffiliations" where "memberId" = $(memberId) and "organizationId" = $(organizationId)`,
      {
        memberId,
        organizationId,
      },
    )
  }
}

export default TempRepository
