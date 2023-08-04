import { generateUUIDv1 as uuid } from '@crowd/common'
import { IOrganizationSyncRemoteData, SyncStatus } from '@crowd/types'
import { QueryTypes } from 'sequelize'
import { IRepositoryOptions } from './IRepositoryOptions'
import { RepositoryBase } from './repositoryBase'

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

  async markOrganizationForSyncing(
    data: IOrganizationSyncRemoteData,
  ): Promise<IOrganizationSyncRemoteData> {
    const existingSyncRemote = await this.findByOrganizationId(data.organizationId)

    if (existingSyncRemote) {
      data.sourceId = existingSyncRemote.sourceId
    }

    const organizationSyncRemoteInserted = await this.options.database.sequelize.query(
      `INSERT INTO "organizationsSyncRemote" ("id", "organizationId", "sourceId", "integrationId", "syncFrom", "metaData", "lastSyncedAt", "status")
          VALUES
              (:id, :organizationId, :sourceId, :integrationId, :syncFrom, :metaData, :lastSyncedAt, :status)
              on conflict do nothing
          RETURNING "id"
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
      },
    )

    const organizationSyncRemote = await this.findById(organizationSyncRemoteInserted[0][0].id)
    return organizationSyncRemote
  }

  async findByOrganizationId(organizationId: string): Promise<IOrganizationSyncRemoteData> {
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
      },
    )

    if (records.length === 0) {
      return null
    }

    return records[0]
  }

  async findById(id: string): Promise<IOrganizationSyncRemoteData> {
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
      },
    )

    if (records.length === 0) {
      return null
    }

    return records[0]
  }
}

export default OrganizationSyncRemoteRepository
