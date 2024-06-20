import { websiteNormalizer } from '@crowd/common'
import { DbStore } from '@crowd/data-access-layer/src/database'
import IntegrationRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/integration.repo'
import {
  addOrgIdentity,
  addOrgToSyncRemote,
  addOrgsToMember,
  addOrgsToSegments,
  findOrgAttributes,
  findOrgBySourceId,
  findOrgByVerifiedIdentity,
  getOrgIdentities,
  insertOrganization,
  prepareOrganizationData,
  updateOrgIdentityVerifiedFlag,
  updateOrganization,
  upsertOrgAttributes,
} from '@crowd/data-access-layer/src/organizations'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import {
  IOrganization,
  IOrganizationIdSource,
  OrganizationIdentityType,
  PlatformType,
} from '@crowd/types'

export class OrganizationService extends LoggerBase {
  constructor(private readonly store: DbStore, parentLog: Logger) {
    super(parentLog)
  }

  public async findOrCreate(
    tenantId: string,
    source: string,
    integrationId: string,
    data: IOrganization,
  ): Promise<string> {
    const verifiedIdentities = data.identities ? data.identities.filter((i) => i.verified) : []
    if (verifiedIdentities.length === 0) {
      const message = `Missing organization identity while creating/updating organization!`
      this.log.error(data, message)
      throw new Error(message)
    }

    try {
      const id = await this.store.transactionally(async (txStore) => {
        const qe = dbStoreQx(txStore)

        // Normalize the website identities
        for (const identity of data.identities.filter((i) =>
          [
            OrganizationIdentityType.PRIMARY_DOMAIN,
            OrganizationIdentityType.ALTERNATIVE_DOMAIN,
          ].includes(i.type),
        )) {
          identity.value = websiteNormalizer(identity.value, false)
        }

        let existing

        // find existing org by sent verified identities
        for (const identity of verifiedIdentities) {
          existing = await findOrgByVerifiedIdentity(qe, tenantId, identity)
          if (existing) {
            break
          }
        }

        let id

        if (existing) {
          this.log.trace(`Found existing organization, organization will be updated!`)

          const existingAttributes = await findOrgAttributes(qe, existing.id)

          const processed = prepareOrganizationData(data, source, existing, existingAttributes)

          this.log.trace({ updateData: processed.organization }, `Updating organization!`)

          if (Object.keys(processed.organization).length > 0) {
            this.log.info({ orgId: existing.id }, `Updating organization!`)
            await updateOrganization(qe, existing.id, processed.organization)
          }

          await upsertOrgAttributes(qe, existing.id, processed.attributes)

          id = existing.id

          const existingIdentities = await getOrgIdentities(qe, id, tenantId)

          const toCreate = []
          const toUpdate = []

          for (const i of data.identities) {
            const existing = existingIdentities.find(
              (ei) => ei.value === i.value && ei.platform === i.platform && ei.type === i.type,
            )
            if (!existing) {
              toCreate.push(i)
            } else if (existing && existing.verified !== i.verified) {
              toUpdate.push(i)
            }
          }

          if (toCreate.length > 0) {
            for (const i of toCreate) {
              // add the identity
              await addOrgIdentity(qe, {
                organizationId: id,
                tenantId,
                platform: i.platform,
                type: i.type,
                value: i.value,
                verified: i.verified,
                sourceId: i.sourceId,
                integrationId,
              })
            }
          }

          if (toUpdate.length > 0) {
            for (const i of toUpdate) {
              // update the identity
              await updateOrgIdentityVerifiedFlag(qe, {
                organizationId: id,
                tenantId,
                platform: i.platform,
                type: i.type,
                value: i.value,
                verified: i.verified,
              })
            }
          }
        } else {
          this.log.trace(`Organization wasn't found via website or identities.`)
          const firstVerified = verifiedIdentities[0]

          const payload = {
            displayName: firstVerified.value,
            description: data.description,
            names: data.names,
            emails: data.emails,
            logo: data.logo,
            tags: data.tags,
            employees: data.employees,
            location: data.location,
            type: data.type,
            size: data.size,
            headline: data.headline,
            industry: data.industry,
            founded: data.founded,
          }

          const processed = prepareOrganizationData(payload, source)

          this.log.trace({ payload: processed }, `Creating new organization!`)

          // if it doesn't exists create it
          id = await insertOrganization(qe, tenantId, processed.organization)

          await upsertOrgAttributes(qe, id, processed.attributes)

          // create identities
          for (const i of data.identities) {
            // add the identity
            await addOrgIdentity(qe, {
              organizationId: id,
              tenantId,
              platform: i.platform,
              type: i.type,
              value: i.value,
              verified: i.verified,
              sourceId: i.sourceId,
              integrationId,
            })
          }
        }

        return id
      })

      return id
    } catch (err) {
      this.log.error(err, 'Error while upserting an organization!')
      throw err
    }
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

          // set a record in organizationsSyncRemote to save the sourceId
          // we can't use organization.attributes because of segments
          if (primaryIdentity.sourceId) {
            await addOrgToSyncRemote(
              qe,
              dbOrganization.id,
              dbIntegration.id,
              primaryIdentity.sourceId,
            )
          }

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
