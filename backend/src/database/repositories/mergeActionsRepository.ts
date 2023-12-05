import { QueryTypes } from 'sequelize'
import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

enum MergeActionType {
  ORG = 'org',
  MEMBER = 'member',
}

enum MergeActionState {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
  ERROR = 'error',
}

class MergeActionsRepository {
  static async add(
    type: MergeActionType,
    primaryId: string,
    secondaryId: string,
    options: IRepositoryOptions,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)
    const tenantId = options.currentTenant.id

    await options.database.sequelize.query(
      `
        INSERT INTO "mergeActions" ("tenantId", "type", "primaryId", "secondaryId", state)
        VALUES (:tenantId, :type, :primaryId, :secondaryId, :state)
        ON CONFLICT ("tenantId", "type", "primaryId", "secondaryId")
        DO UPDATE SET state = :state
      `,
      {
        replacements: {
          tenantId,
          type,
          primaryId,
          secondaryId,
          state: MergeActionState.PENDING,
        },
        type: QueryTypes.INSERT,
        transaction,
      },
    )
  }

  static async setState(
    type: MergeActionType,
    primaryId: string,
    secondaryId: string,
    state: MergeActionState,
    options: IRepositoryOptions,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)
    const tenantId = options.currentTenant.id

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, rowCount] = await options.database.sequelize.query(
      `
        UPDATE "mergeActions"
        SET state = :state
        WHERE "tenantId" = :tenantId
          AND type = :type
          AND "primaryId" = :primaryId
          AND "secondaryId" = :secondaryId
          AND state != :state
      `,
      {
        replacements: {
          tenantId,
          type,
          primaryId,
          secondaryId,
          state,
        },
        type: QueryTypes.UPDATE,
        transaction,
      },
    )

    return rowCount > 0
  }
}

export { MergeActionsRepository, MergeActionType, MergeActionState }
