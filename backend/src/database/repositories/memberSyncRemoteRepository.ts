import { generateUUIDv1 as uuid } from '@crowd/common'
import { IMemberSyncRemoteData, SyncStatus } from '@crowd/types'
import { QueryTypes } from 'sequelize'
import { IRepositoryOptions } from './IRepositoryOptions'
import { RepositoryBase } from './repositoryBase'

class MemberSyncRemoteRepository extends RepositoryBase<
  IMemberSyncRemoteData,
  string,
  IMemberSyncRemoteData,
  unknown,
  unknown
> {
  public constructor(options: IRepositoryOptions) {
    super(options, true)
  }

  async stopSyncingAutomation(automationId: string) {
    await this.options.database.sequelize.query(
      `update "membersSyncRemote" set status = :status where "syncFrom" = :automationId
        `,
      {
        replacements: {
          status: SyncStatus.STOPPED,
          automationId,
        },
        type: QueryTypes.UPDATE,
      },
    )
  }

  async stopMemberManualSync(memberId: string) {
    await this.options.database.sequelize.query(
      `update "membersSyncRemote" set status = :status where "memberId" = :memberId and "syncFrom" = :manualSync
        `,
      {
        replacements: {
          status: SyncStatus.STOPPED,
          memberId,
          manualSync: 'manual',
        },
        type: QueryTypes.UPDATE,
      },
    )
  }

  async markMemberForSyncing(data: IMemberSyncRemoteData): Promise<IMemberSyncRemoteData> {
    const existingSyncRemote = await this.findByMemberId(data.memberId)

    if (existingSyncRemote) {
      data.sourceId = existingSyncRemote.sourceId
    }

    const memberSyncRemoteInserted = await this.options.database.sequelize.query(
      `insert into "membersSyncRemote" ("id", "memberId", "sourceId", "integrationId", "syncFrom", "metaData", "lastSyncedAt", "status")
          values
              (:id, :memberId, :sourceId, :integrationId, :syncFrom, :metaData, :lastSyncedAt, :status)
          on conflict ("integrationId", "memberId", "syncFrom")
          do update 
              set "id" = membersSyncRemote."id" 
          returning "id"
        `,
      {
        replacements: {
          id: uuid(),
          memberId: data.memberId,
          integrationId: data.integrationId,
          syncFrom: data.syncFrom,
          metaData: data.metaData,
          lastSyncedAt: data.lastSyncedAt || null,
          sourceId: data.sourceId || null,
          status: SyncStatus.ACTIVE,
        },
        type: QueryTypes.INSERT,
      },
    )

    const memberSyncRemote = await this.findById(memberSyncRemoteInserted[0][0].id)
    return memberSyncRemote
  }

  async findByMemberId(memberId: string): Promise<IMemberSyncRemoteData> {
    const records = await this.options.database.sequelize.query(
      `SELECT *
             FROM "membersSyncRemote"
             WHERE "memberId" = :memberId
             and "sourceId" is not null
             limit 1;
            `,
      {
        replacements: {
          memberId,
        },
        type: QueryTypes.SELECT,
      },
    )

    if (records.length === 0) {
      return null
    }

    return records[0]
  }

  async findById(id: string): Promise<IMemberSyncRemoteData> {
    const records = await this.options.database.sequelize.query(
      `SELECT *
             FROM "membersSyncRemote"
             WHERE id = :id;
            `,
      {
        replacements: {
          id,
        },
        type: QueryTypes.SELECT,
      },
    )

    if (records.length === 0) {
      return null
    }

    return records[0]
  }
}

export default MemberSyncRemoteRepository
