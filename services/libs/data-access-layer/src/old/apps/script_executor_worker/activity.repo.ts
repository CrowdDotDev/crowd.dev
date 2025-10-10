import { DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { EntityType } from './types'

class ActivityRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
  ) {}

  private getEntityColumn(type: EntityType): string {
    return type === EntityType.MEMBER ? 'memberId' : 'organizationId'
  }

  async moveActivityRelations(
    primaryId: string,
    secondaryId: string,
    type: EntityType,
  ): Promise<void> {
    const columnName = this.getEntityColumn(type)

    await this.connection.none(
      `UPDATE "activityRelations" SET "${columnName}" = $(primaryId), "updatedAt" = now() WHERE "${columnName}" = $(secondaryId)`,
      {
        primaryId,
        secondaryId,
      },
    )
  }

  async getActivityIdsForMember(memberId: string, where: string, limit: number): Promise<string[]> {
    const results = await this.connection.query(
      `SELECT "activityId" FROM "activityRelations" WHERE "memberId" = $(memberId) AND ${where} limit $(limit)`,
      { memberId, limit },
    )
    return results.map((result) => result.activityId)
  }

  async removeOrgAffiliationForActivities(activityIds: string[]): Promise<void> {
    await this.connection.none(
      `UPDATE "activityRelations" SET "organizationId" = null, "updatedAt" = now() WHERE "organizationId" IS NOT NULL AND "activityId" IN ($(activityIds:csv))`,
      { activityIds },
    )
  }
}

export default ActivityRepository
