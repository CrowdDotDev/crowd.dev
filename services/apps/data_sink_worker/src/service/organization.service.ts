import { DbStore } from '@crowd/data-access-layer/src/database'
import {
  addOrgsToMember,
  addOrgsToSegments,
  findMemberOrganizations,
  findOrCreateOrganization,
} from '@crowd/data-access-layer/src/organizations'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { Logger, LoggerBase } from '@crowd/logging'
import { IMemberOrganization, IOrganization, IOrganizationIdSource } from '@crowd/types'

export class OrganizationService extends LoggerBase {
  constructor(
    private readonly store: DbStore,
    parentLog: Logger,
  ) {
    super(parentLog)
  }

  public async findOrCreate(
    source: string,
    integrationId: string,
    data: IOrganization,
  ): Promise<string> {
    const id = await this.store.transactionally(async (txStore) => {
      const qe = dbStoreQx(txStore)
      const id = await findOrCreateOrganization(qe, source, data, integrationId)
      return id
    })

    if (!id) {
      throw new Error('Organization not found or created!')
    }

    return id
  }

  public async addToMember(
    segmentIds: string[],
    memberId: string,
    orgs: IOrganizationIdSource[],
  ): Promise<void> {
    const qe = dbStoreQx(this.store)

    await addOrgsToSegments(
      qe,
      segmentIds,
      orgs.map((org) => org.id),
    )

    await addOrgsToMember(qe, memberId, orgs)
  }

  public async findMemberOrganizations(
    memberId: string,
    organizationId: string,
  ): Promise<IMemberOrganization[]> {
    const qe = dbStoreQx(this.store)

    return findMemberOrganizations(qe, memberId, organizationId)
  }
}
