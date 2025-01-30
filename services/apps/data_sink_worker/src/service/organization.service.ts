import { DbStore } from '@crowd/data-access-layer/src/database'
import IntegrationRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/integration.repo'
import {
  addOrgsToMember,
  addOrgsToSegments,
  findMemberOrganizations,
  findOrCreateOrganization,
  findOrgBySourceId,
  findOrgByVerifiedIdentity,
  getOrgIdentities,
} from '@crowd/data-access-layer/src/organizations'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import {
  IMemberOrganization,
  IOrganization,
  IOrganizationIdSource,
  PlatformType,
} from '@crowd/types'

export class OrganizationService extends LoggerBase {
  constructor(
    private readonly store: DbStore,
    parentLog: Logger,
  ) {
    super(parentLog)
  }

  public async findOrCreate(
    tenantId: string,
    source: string,
    integrationId: string,
    data: IOrganization,
  ): Promise<string> {
    const id = await this.store.transactionally(async (txStore) => {
      const qe = dbStoreQx(txStore)
      const id = await findOrCreateOrganization(qe, tenantId, source, data, integrationId)
      return id
    })

    if (!id) {
      throw new Error('Organization not found or created!')
    }

    return id
  }

  public async addToMember(
    tenantId: string,
    segmentId: string,
    memberId: string,
    orgs: IOrganizationIdSource[],
  ): Promise<void> {
    const qe = dbStoreQx(this.store)

    await addOrgsToSegments(
      qe,
      tenantId,
      segmentId,
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

  public async processOrganizationEnrich(
    tenantId: string,
    integrationId: string,
    platform: PlatformType,
    organization: IOrganization,
  ): Promise<void> {
    this.log = getChildLogger('OrganizationService.processOrganizationEnrich', this.log, {
      integrationId,
      tenantId,
    })

    try {
      this.log.debug('Processing organization enrich.')

      const verifiedIdentities = organization.identities.filter((i) => i.verified)
      if (verifiedIdentities.length === 0) {
        const errorMessage = `Organization can't be enriched. It doesn't have identities!`
        this.log.warn(errorMessage)
        return
      }

      const primaryIdentity = verifiedIdentities[0]

      await this.store.transactionally(async (txStore) => {
        const qe = dbStoreQx(txStore)
        const txIntegrationRepo = new IntegrationRepository(txStore, this.log)

        const txService = new OrganizationService(txStore, this.log)

        const dbIntegration = await txIntegrationRepo.findById(integrationId)
        const segmentId = dbIntegration.segmentId

        // first try finding the organization using the remote sourceId
        let dbOrganization = primaryIdentity.sourceId
          ? await findOrgBySourceId(qe, tenantId, segmentId, platform, primaryIdentity.sourceId)
          : null

        if (!dbOrganization) {
          // try finding the organization using verified identities
          for (const i of verifiedIdentities) {
            dbOrganization = await findOrgByVerifiedIdentity(qe, tenantId, i)
            if (dbOrganization) {
              break
            }
          }
        }

        if (dbOrganization) {
          this.log.trace({ organizationId: dbOrganization.id }, 'Found existing organization.')

          // check if sent primary identity already exists in the org
          const existingIdentities = await getOrgIdentities(qe, dbOrganization.id, tenantId)

          // merge existing and incoming identities
          for (const i of existingIdentities) {
            if (
              organization.identities.find(
                (oi) =>
                  oi.type === i.type &&
                  oi.value === i.value &&
                  oi.platform === i.platform &&
                  oi.verified === i.verified,
              )
            ) {
              continue
            }

            organization.identities.push(i)
          }

          await txService.findOrCreate(tenantId, segmentId, integrationId, organization)
        } else {
          this.log.debug(
            'No organization found for enriching. This organization enrich process had no affect.',
          )
        }
      })
    } catch (err) {
      this.log.error(err, 'Error while processing an organization enrich!')
      throw err
    }
  }
}
