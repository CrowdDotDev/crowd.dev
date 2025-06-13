import { DbConnOrTx, DbConnection, DbTransaction } from '@crowd/database'
import { Logger } from '@crowd/logging'

import { EntityType } from './types'

class ActivityRepository {
  constructor(
    private readonly connection: DbConnection | DbTransaction,
    private readonly log: Logger,
    private readonly questdbSQL: DbConnOrTx,
  ) {}

  private getEntityColumn(type: EntityType): string {
    return type === EntityType.MEMBER ? 'memberId' : 'organizationId'
  }

  async doesActivityExistInQuestDb(id: string, type: EntityType): Promise<boolean> {
    const results = await this.questdbSQL.query(
      `select 1 from activities where "${this.getEntityColumn(type)}" = $(id) limit 1`,
      { id },
    )

    return results.length > 0
  }

  async moveActivitiesToCorrectEntity(
    oldEntityId: string,
    newEntityId: string,
    type: EntityType,
  ): Promise<void> {
    const columnName = this.getEntityColumn(type)

    await this.questdbSQL.none(
      `UPDATE activities SET "${columnName}" = $(newEntityId), "updatedAt" = now() WHERE "${columnName}" = $(oldEntityId)`,
      {
        oldEntityId,
        newEntityId,
      },
    )
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
