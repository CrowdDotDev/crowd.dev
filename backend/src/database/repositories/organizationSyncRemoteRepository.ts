import { QueryTypes } from 'sequelize'

import { generateUUIDv1 as uuid } from '@crowd/common'
import { IOrganizationSyncRemoteData, SyncStatus } from '@crowd/types'

import { IRepositoryOptions } from './IRepositoryOptions'
import { RepositoryBase } from './repositoryBase'
import SequelizeRepository from './sequelizeRepository'

class OrganizationSyncRemoteRepository extends RepositoryBase<
  IOrganizationSyncRemoteData,
  string,
  IOrganizationSyncRemoteData,
  unknown,
  unknown
> {
  public constructor(options: IRepositoryOptions) {
    super(options, true)
  }

  async stopSyncingAutomation(automationId: string) {
    await this.options.database.sequelize.query(
      `update "organizationsSyncRemote" set status = :status where "syncFrom" = :automationId
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

  async stopOrganizationManualSync(organizationId: string) {
    await this.options.database.sequelize.query(
      `update "organizationsSyncRemote" set status = :status where "organizationId" = :organizationId and "syncFrom" = :manualSync
        `,
      {
        replacements: {
          status: SyncStatus.STOPPED,
          organizationId,
          manualSync: 'manual',
        },
        type: QueryTypes.UPDATE,
      },
    )
  }

  async startManualSync(id: string, sourceId: string) {
    const transaction = SequelizeRepository.getTransaction(this.options)

    await this.options.database.sequelize.query(
      `update "organizationsSyncRemote" set status = :status, "sourceId" = :sourceId where "id" = :id
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

  async findRemoteSync(integrationId: string, organizationId: string, syncFrom: string) {
    const transaction = SequelizeRepository.getTransaction(this.options)

    const records = await this.options.database.sequelize.query(
      `SELECT *
             FROM "organizationsSyncRemote"
             WHERE "integrationId" = :integrationId and "organizationId" = :organizationId and "syncFrom" = :syncFrom;
            `,
      {
        replacements: {
          integrationId,
          organizationId,
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

  async markOrganizationForSyncing(
    data: IOrganizationSyncRemoteData,
  ): Promise<IOrganizationSyncRemoteData> {
    const transaction = SequelizeRepository.getTransaction(this.options)

    const existingSyncRemote = await this.findByOrganizationId(data.organizationId)

    if (existingSyncRemote) {
      data.sourceId = existingSyncRemote.sourceId
    }

    const existingManualSyncRemote = await this.findRemoteSync(
      data.integrationId,
      data.organizationId,
      data.syncFrom,
    )

    if (existingManualSyncRemote) {
      await this.startManualSync(existingManualSyncRemote.id, data.sourceId)
      return existingManualSyncRemote
    }

    const organizationSyncRemoteInserted = await this.options.database.sequelize.query(
      `insert into "organizationsSyncRemote" ("id", "organizationId", "sourceId", "integrationId", "syncFrom", "metaData", "lastSyncedAt", "status")
          VALUES
              (:id, :organizationId, :sourceId, :integrationId, :syncFrom, :metaData, :lastSyncedAt, :status)
          returning "id"
        `,
      {
        replacements: {
          id: uuid(),
          organizationId: data.organizationId,
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

    const organizationSyncRemote = await this.findById(organizationSyncRemoteInserted[0][0].id)
    return organizationSyncRemote
  }

  async destroyAllAutomation(automationIds: string[]): Promise<void> {
    const transaction = this.transaction

    const seq = this.seq

    const query = `
    delete 
    from "organizationsSyncRemote"
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
    from "organizationsSyncRemote"
    where "integrationId" in (:integrationIds);`

    await seq.query(query, {
      replacements: {
        integrationIds,
      },
      type: QueryTypes.DELETE,
      transaction,
    })
  }

  async findOrganizationManualSync(organizationId: string) {
    const transaction = SequelizeRepository.getTransaction(this.options)

    const records = await this.options.database.sequelize.query(
      `select i.platform, osr.status from "organizationsSyncRemote" osr
      inner join integrations i on osr."integrationId" = i.id
      where osr."syncFrom" = :syncFrom and osr."organizationId" = :organizationId;
            `,
      {
        replacements: {
          organizationId,
          syncFrom: 'manual',
        },
        type: QueryTypes.SELECT,
        transaction,
      },
    )

    return records
  }

  async findByOrganizationId(organizationId: string): Promise<IOrganizationSyncRemoteData> {
    const transaction = SequelizeRepository.getTransaction(this.options)

    const records = await this.options.database.sequelize.query(
      `SELECT *
             FROM "organizationsSyncRemote"
             WHERE "organizationId" = :organizationId
             and "sourceId" is not null
             limit 1;
            `,
      {
        replacements: {
          organizationId,
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

  async findById(id: string): Promise<IOrganizationSyncRemoteData> {
    const transaction = SequelizeRepository.getTransaction(this.options)

    const records = await this.options.database.sequelize.query(
      `SELECT *
             FROM "organizationsSyncRemote"
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

export default OrganizationSyncRemoteRepository
