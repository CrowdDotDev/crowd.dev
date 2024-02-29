import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbIntegration } from './integration.data'

export class IntegrationRepository extends RepositoryBase<IntegrationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async findById(id: string): Promise<IDbIntegration | null> {
    return await this.db().oneOrNone(`select * from integrations where id = $(id)`, { id })
  }

  public async findIntegration(
    platform: string,
    tenantId: string,
    segmentId: string,
  ): Promise<IDbIntegration | null> {
    return await this.db().oneOrNone(
      `select * from integrations where "platform" = $(platform) and "tenantId" = $(tenantId) and "segmentId" = $(segmentId)`,
      { platform, tenantId, segmentId },
    )
  }
}
