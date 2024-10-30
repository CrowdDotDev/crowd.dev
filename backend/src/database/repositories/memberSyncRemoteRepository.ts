import { QueryTypes } from 'sequelize'

import { generateUUIDv1 as uuid } from '@crowd/common'
import { IMemberSyncRemoteData, SyncStatus } from '@crowd/types'

import { IRepositoryOptions } from './IRepositoryOptions'
import { RepositoryBase } from './repositoryBase'
import SequelizeRepository from './sequelizeRepository'

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

  async findRemoteSync(integrationId: string, memberId: string, syncFrom: string) {
    const transaction = SequelizeRepository.getTransaction(this.options)

    const records = await this.options.database.sequelize.query(
      `SELECT *
             FROM "membersSyncRemote"
             WHERE "integrationId" = :integrationId and "memberId" = :memberId and "syncFrom" = :syncFrom;
            `,
      {
        replacements: {
          integrationId,
          memberId,
          syncFrom,
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

  async startManualSync(id: string, sourceId: string) {
    const transaction = SequelizeRepository.getTransaction(this.options)

    await this.options.database.sequelize.query(
      `update "membersSyncRemote" set status = :status, "sourceId" = :sourceId where "id" = :id
        `,
      {
        replacements: {
          status: SyncStatus.ACTIVE,
          id,
          sourceId: sourceId || null,
        },
        type: QueryTypes.UPDATE,
        transaction,
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

  async destroyAllAutomation(automationIds: string[]): Promise<void> {
    const transaction = this.transaction

    const seq = this.seq

    const query = `
    delete 
    from "membersSyncRemote"
    where "syncFrom" in (:automationIds);`

    await seq.query(query, {
      replacements: {
        automationIds,
      },
      type: QueryTypes.DELETE,
      transaction,
    })
  }

  async destroyAllIntegration(integrationIds: string[]): Promise<void> {
    const transaction = this.transaction

    const seq = this.seq

    const query = `
    delete 
    from "membersSyncRemote"
    where "integrationId" in (:integrationIds);`

    await seq.query(query, {
      replacements: {
        integrationIds,
      },
      type: QueryTypes.DELETE,
      transaction,
    })
  }

  async markMemberForSyncing(data: IMemberSyncRemoteData): Promise<IMemberSyncRemoteData> {
    const transaction = SequelizeRepository.getTransaction(this.options)

    const existingSyncRemote = await this.findByMemberId(data.memberId)

    if (existingSyncRemote) {
      data.sourceId = existingSyncRemote.sourceId
    }

    const existingManualSyncRemote = await this.findRemoteSync(
      data.integrationId,
      data.memberId,
      data.syncFrom,
    )

    if (existingManualSyncRemote) {
      await this.startManualSync(existingManualSyncRemote.id, data.sourceId)
      return existingManualSyncRemote
    }

    const memberSyncRemoteInserted = await this.options.database.sequelize.query(
      `insert into "membersSyncRemote" ("id", "memberId", "sourceId", "integrationId", "syncFrom", "metaData", "lastSyncedAt", "status")
          values
              (:id, :memberId, :sourceId, :integrationId, :syncFrom, :metaData, :lastSyncedAt, :status)
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
        transaction,
      },
    )

    const memberSyncRemote = await this.findById(memberSyncRemoteInserted[0][0].id)
    return memberSyncRemote
  }

  async findMemberManualSync(memberId: string) {
    const transaction = SequelizeRepository.getTransaction(this.options)

    const records = await this.options.database.sequelize.query(
      `select i.platform, msr.status from "membersSyncRemote" msr
      inner join integrations i on msr."integrationId" = i.id
      where msr."syncFrom" = :syncFrom and msr."memberId" = :memberId;
            `,
      {
        replacements: {
          memberId,
          syncFrom: 'manual',
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return records
  }

  async findByMemberId(memberId: string): Promise<IMemberSyncRemoteData> {
    const transaction = SequelizeRepository.getTransaction(this.options)

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
        transaction,
      },
    )

    if (records.length === 0) {
      return null
    }

    return records[0]
  }

  async findById(id: string): Promise<IMemberSyncRemoteData> {
    const transaction = SequelizeRepository.getTransaction(this.options)

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
        transaction,
      },
    )

    if (records.length === 0) {
      return null
    }

    return records[0]
  }
}

export default MemberSyncRemoteRepository
