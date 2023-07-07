import { DbStore, RepositoryBase } from '@crowd/database'
import { Logger } from '@crowd/logging'
import { IDbCacheOrganization, IDbOrganization } from './organization.data'

export class OrganizationRepository extends RepositoryBase<OrganizationRepository> {
  constructor(dbStore: DbStore, parentLog: Logger) {
    super(dbStore, parentLog)
  }

  public async findCacheByName(name: string): Promise<IDbCacheOrganization> {
    throw new Error('Not implemented')
  }

  public async findByName(tenantId: string, name: string): Promise<IDbOrganization> {
    throw new Error('Not implemented')
  }
}
