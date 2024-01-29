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
  FINISHING = 'finishing',
  ERROR = 'error',
}

interface IUnmergeBackup {
  primary: unknown
  secondary: unknown
}

class MergeActionsRepository {
  static async add(
    type: MergeActionType,
    primaryId: string,
    secondaryId: string,
    options: IRepositoryOptions,
    state: MergeActionState = MergeActionState.PENDING,
    backup: IUnmergeBackup = undefined,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)
    const tenantId = options.currentTenant.id

    await options.database.sequelize.query(
      `
        INSERT INTO "mergeActions" ("tenantId", "type", "primaryId", "secondaryId", state, "unmergeBackup")
        VALUES (:tenantId, :type, :primaryId, :secondaryId, :state, :backup)
        ON CONFLICT ("tenantId", "type", "primaryId", "secondaryId")
        DO UPDATE SET state = :state
      `,
      {
        replacements: {
          tenantId,
          type,
          primaryId,
          secondaryId,
          state,
          backup: backup ? JSON.stringify(backup) : null,
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
