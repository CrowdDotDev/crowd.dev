import { QueryTypes } from 'sequelize'
import {
  IMemberIdentity,
  IMemberUnmergeBackup,
  IMergeAction,
  IUnmergeBackup,
  MergeActionState,
  MergeActionType,
} from '@crowd/types'
import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

class MergeActionsRepository {
  static async add(
    type: MergeActionType,
    primaryId: string,
    secondaryId: string,
    options: IRepositoryOptions,
    state: MergeActionState = MergeActionState.PENDING,
    backup: IUnmergeBackup<IMemberUnmergeBackup> = undefined,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)
    const tenantId = options.currentTenant.id

    await options.database.sequelize.query(
      `
        INSERT INTO "mergeActions" ("tenantId", "type", "primaryId", "secondaryId", state, "unmergeBackup")
        VALUES (:tenantId, :type, :primaryId, :secondaryId, :state, :backup)
        ON CONFLICT ("tenantId", "type", "primaryId", "secondaryId")
        DO UPDATE SET state = :state, "unmergeBackup" = :backup
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

  static async findMergeBackup(
    primaryMemberId: string,
    identity: IMemberIdentity,
    options: IRepositoryOptions,
  ): Promise<IMergeAction> {
    const transaction = SequelizeRepository.getTransaction(options)

    const records = await options.database.sequelize.query(
      `
      select *
      from "mergeActions" ma
      where ma."primaryId" = :primaryMemberId
        and exists(
              select 1
              from jsonb_array_elements(ma."unmergeBackup" -> 'secondary' -> 'identities') as identities
              where identities ->> 'username' = :secondaryMemberIdentityUsername
                and identities ->> 'platform' = :secondaryMemberIdentityPlatform
          );
      `,
      {
        replacements: {
          primaryMemberId,
          secondaryMemberIdentityUsername: identity.username,
          secondaryMemberIdentityPlatform: identity.platform,
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    if (records.length === 0) {
      return null
    }

    return records[0]
  }
}

export { MergeActionsRepository }
