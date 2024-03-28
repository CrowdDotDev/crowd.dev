import { QueryTypes } from 'sequelize'
import {
  IMemberIdentity,
  IMemberUnmergeBackup,
  IMergeAction,
  IOrganizationIdentity,
  IOrganizationUnmergeBackup,
  IUnmergeBackup,
  MemberIdentityType,
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
    backup: IUnmergeBackup<IMemberUnmergeBackup | IOrganizationUnmergeBackup> = undefined,
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

  static async findById(id: string, options: IRepositoryOptions): Promise<IMergeAction> {
    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.sequelize.query(
      `
      SELECT *
      FROM "mergeActions"
      WHERE id = :id;
      `,
      {
        replacements: { id },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    if (record.length === 1) {
      const data = record[0] as IMergeAction

      // fix old identities to use the new format
      if (data.type === MergeActionType.MEMBER && data.unmergeBackup) {
        const backup = data.unmergeBackup as IUnmergeBackup<IMemberUnmergeBackup>
        if (backup.primary) {
          for (const identity of backup.primary.identities) {
            if ('username' in identity) {
              identity.value = (identity as any).username
              identity.type = MemberIdentityType.USERNAME
              delete (identity as any).username
            }
          }
        }

        if (backup.secondary) {
          for (const identity of backup.secondary.identities) {
            if ('username' in identity) {
              identity.value = (identity as any).username
              identity.type = MemberIdentityType.USERNAME
              delete (identity as any).username
            }
          }
        }
      }
    }

    return null
  }

  static async findMergeBackup(
    primaryMemberId: string,
    type: MergeActionType,
    identity: IMemberIdentity | IOrganizationIdentity,
    options: IRepositoryOptions,
  ): Promise<IMergeAction> {
    const transaction = SequelizeRepository.getTransaction(options)

    let records

    if (type === MergeActionType.MEMBER) {
      const memberIdentity = identity as IMemberIdentity
      records = await options.database.sequelize.query(
        `
        select *
        from "mergeActions" ma
        where ma."primaryId" = :primaryMemberId
          and exists(
                select 1
                from jsonb_array_elements(ma."unmergeBackup" -> 'secondary' -> 'identities') as identities
                where (identities ->> 'username' = :secondaryMemberIdentityValue or (identities ->> 'type' = :secondaryMemberIdentityType and identities ->> 'value' = :secondaryMemberIdentityValue))
                  and identities ->> 'platform' = :secondaryMemberIdentityPlatform
            );
        `,
        {
          replacements: {
            primaryMemberId,
            secondaryMemberIdentityValue: memberIdentity.value,
            secondaryMemberIdentityType: memberIdentity.type,
            secondaryMemberIdentityPlatform: memberIdentity.platform,
          },
          type: QueryTypes.SELECT,
          transaction,
        },
      )

      // fix old identities to use the new format
      for (const record of records) {
        const data = record as IMergeAction

        // fix old identities to use the new format
        if (data.type === MergeActionType.MEMBER && data.unmergeBackup) {
          const backup = data.unmergeBackup as IUnmergeBackup<IMemberUnmergeBackup>

          if (backup.primary) {
            for (const identity of backup.primary.identities) {
              if ('username' in identity) {
                identity.value = (identity as any).username
                identity.type = MemberIdentityType.USERNAME
                delete (identity as any).username
              }
            }
          }

          if (backup.secondary) {
            for (const identity of backup.secondary.identities) {
              if ('username' in identity) {
                identity.value = (identity as any).username
                identity.type = MemberIdentityType.USERNAME
                delete (identity as any).username
              }
            }
          }
        }
      }
    } else if (type === MergeActionType.ORG) {
      const organizationIdentity = identity as IOrganizationIdentity
      records = await options.database.sequelize.query(
        `
        select *
        from "mergeActions" ma
        where ma."primaryId" = :primaryMemberId
          and exists(
                select 1
                from jsonb_array_elements(ma."unmergeBackup" -> 'secondary' -> 'identities') as identities
                where identities ->> 'name' = :secondaryMemberIdentityName
                  and identities ->> 'platform' = :secondaryMemberIdentityPlatform
            );
        `,
        {
          replacements: {
            primaryMemberId,
            secondaryMemberIdentityName: organizationIdentity.name,
            secondaryMemberIdentityPlatform: identity.platform,
          },
          type: QueryTypes.SELECT,
          transaction,
        },
      )
    }

    if (records.length === 0) {
      return null
    }

    return records[0]
  }
}

export { MergeActionsRepository }
