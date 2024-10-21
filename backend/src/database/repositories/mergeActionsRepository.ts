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
  MergeActionStep,
  MergeActionType,
  OrganizationIdentityType,
} from '@crowd/types'

import { IRepositoryOptions } from './IRepositoryOptions'
import SequelizeRepository from './sequelizeRepository'

class MergeActionsRepository {
  static async add(
    type: MergeActionType,
    primaryId: string,
    secondaryId: string,
    options: IRepositoryOptions,
    step: MergeActionStep,
    state: MergeActionState = MergeActionState.PENDING,
    backup: IUnmergeBackup<IMemberUnmergeBackup | IOrganizationUnmergeBackup> = undefined,
  ) {
    const transaction = SequelizeRepository.getTransaction(options)
    const tenantId = options.currentTenant.id
    const userId = options.currentUser?.id

    await options.database.sequelize.query(
      `
        INSERT INTO "mergeActions" ("tenantId", "type", "primaryId", "secondaryId", state, step, "unmergeBackup", "actionBy")
        VALUES (:tenantId, :type, :primaryId, :secondaryId, :state, :step, :backup, :userId)
        ON CONFLICT ("tenantId", "type", "primaryId", "secondaryId")
        DO UPDATE SET state = :state, "unmergeBackup" = :backup
      `,
      {
        replacements: {
          tenantId,
          type,
          primaryId,
          secondaryId,
          step,
          state,
          backup: backup ? JSON.stringify(backup) : null,
          userId,
        },
        type: QueryTypes.INSERT,
        transaction,
      },
    )
  }

  static async setMergeAction(
    type: MergeActionType,
    primaryId: string,
    secondaryId: string,
    options: IRepositoryOptions,
    data: {
      step?: MergeActionStep
      state?: MergeActionState
    },
  ) {
    const transaction = SequelizeRepository.getTransaction(options)
    const tenantId = options.currentTenant.id

    const setClauses = []
    const replacements: any = {
      tenantId,
      type,
      primaryId,
      secondaryId,
    }

    if (data.step) {
      setClauses.push(`step = :step`)
      replacements.step = data.step
    }

    if (data.state) {
      setClauses.push(`state = :state`)
      replacements.state = data.state
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [_, rowCount] = await options.database.sequelize.query(
      `
        UPDATE "mergeActions"
        SET ${setClauses.join(', ')}
        WHERE "tenantId" = :tenantId
          AND type = :type
          AND "primaryId" = :primaryId
          AND "secondaryId" = :secondaryId
      `,
      {
        replacements,
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

      return data
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
                where (identities ->> 'name' = :secondaryOrgIdentityValue or (identities ->> 'type' = :secondaryOrgIdentityType and identities ->> 'value' = :secondaryOrgIdentityValue))
                  and identities ->> 'platform' = :secondaryOrgIdentityPlatform
            );
        `,
        {
          replacements: {
            primaryMemberId,
            secondaryOrgIdentityType: organizationIdentity.type,
            secondaryOrgIdentityValue: organizationIdentity.value,
            secondaryOrgIdentityPlatform: organizationIdentity.platform,
          },
          type: QueryTypes.SELECT,
          transaction,
        },
      )

      // fix old identities to use the new format
      for (const record of records) {
        const data = record as IMergeAction

        // fix old identities to use the new format
        if (data.type === MergeActionType.ORG && data.unmergeBackup) {
          const backup = data.unmergeBackup as IUnmergeBackup<IOrganizationUnmergeBackup>

          if (backup.primary) {
            for (const identity of backup.primary.identities) {
              if ('name' in identity) {
                identity.value = (identity as any).name
                identity.type = OrganizationIdentityType.USERNAME
                delete (identity as any).name
              }
            }

            if ((backup.primary as any).website) {
              backup.primary.identities.push({
                type: OrganizationIdentityType.PRIMARY_DOMAIN,
                value: (backup.primary as any).website,
                platform: 'custom',
                verified: true,
              })
            }

            if ((backup.primary as any).alternativeDomains) {
              for (const domain of (backup.primary as any).alternativeDomains) {
                backup.primary.identities.push({
                  type: OrganizationIdentityType.ALTERNATIVE_DOMAIN,
                  value: domain,
                  platform: 'enrichment',
                  verified: false,
                })
              }
            }

            if ((backup.primary as any).affiliatedProfiles) {
              for (const profile of (backup.primary as any).affiliatedProfiles) {
                backup.primary.identities.push({
                  type: OrganizationIdentityType.AFFILIATED_PROFILE,
                  value: profile,
                  platform: 'enrichment',
                  verified: false,
                })
              }
            }
          }

          if (backup.secondary) {
            for (const identity of backup.secondary.identities) {
              if ('name' in identity) {
                identity.value = (identity as any).name
                identity.type = OrganizationIdentityType.USERNAME
                delete (identity as any).name
              }
            }

            if ((backup.secondary as any).website) {
              backup.secondary.identities.push({
                type: OrganizationIdentityType.PRIMARY_DOMAIN,
                value: (backup.secondary as any).website,
                platform: 'custom',
                verified: true,
              })
            }

            if ((backup.secondary as any).alternativeDomains) {
              for (const domain of (backup.secondary as any).alternativeDomains) {
                backup.secondary.identities.push({
                  type: OrganizationIdentityType.ALTERNATIVE_DOMAIN,
                  value: domain,
                  platform: 'enrichment',
                  verified: false,
                })
              }
            }

            if ((backup.secondary as any).affiliatedProfiles) {
              for (const profile of (backup.secondary as any).affiliatedProfiles) {
                backup.secondary.identities.push({
                  type: OrganizationIdentityType.AFFILIATED_PROFILE,
                  value: profile,
                  platform: 'enrichment',
                  verified: false,
                })
              }
            }
          }
        }
      }
    }

    if (records.length === 0) {
      return null
    }

    return records[0]
  }
}

export { MergeActionsRepository }
