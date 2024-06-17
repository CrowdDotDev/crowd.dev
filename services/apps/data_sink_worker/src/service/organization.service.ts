import mergeWith from 'lodash.mergewith'
import isEqual from 'lodash.isequal'
import IntegrationRepository from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/integration.repo'
import { OrganizationRepository } from '@crowd/data-access-layer/src/old/apps/data_sink_worker/repo/organization.repo'
import { DbStore } from '@crowd/data-access-layer/src/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { IOrganization, OrganizationIdentityType, PlatformType } from '@crowd/types'
import { websiteNormalizer } from '@crowd/common'

export interface IOrganizationIdSource {
  id: string
  source: string
}

export class OrganizationService extends LoggerBase {
  private readonly repo: OrganizationRepository

  constructor(private readonly store: DbStore, parentLog: Logger) {
    super(parentLog)

    this.repo = new OrganizationRepository(store, this.log)
  }

  public async findOrCreate(
    tenantId: string,
    segmentId: string,
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
        const txRepo = new OrganizationRepository(txStore, this.log)

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
          existing = await txRepo.findByVerifiedIdentity(tenantId, identity)
          if (existing) {
            break
          }
        }

        let attributes = existing?.attributes

        if (data?.attributes) {
          const temp = mergeWith({}, existing?.attributes, data?.attributes)
          if (!isEqual(temp, existing?.attributes)) {
            attributes = temp
          }
        }

        let id

        if (existing) {
          this.log.trace(`Found existing organization, organization will be updated!`)

          // if it does exists update it
          const updateData: Partial<IOrganization> = {}
          const fields = [
            'description',
            'names',
            'emails',
            'logo',
            'tags',
            'employees',
            'location',
            'type',
            'size',
            'headline',
            'industry',
            'founded',
            'attributes',
          ]

          if (!existing.displayName || data.displayName.trim().length === 0) {
            fields.push('displayName')
          }

          fields.forEach((field) => {
            if (!existing[field] && data[field]) {
              updateData[field] = data[field]
            }
          })

          this.log.trace({ updateData }, `Updating organization!`)

          if (Object.keys(updateData).length > 0) {
            await this.repo.update(existing.id, updateData)
          }

          id = existing.id

          const existingIdentities = await txRepo.getIdentities(id, tenantId)

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
              await txRepo.addIdentity(id, tenantId, {
                ...i,
                integrationId,
              })
            }
          }

          if (toUpdate.length > 0) {
            for (const i of toUpdate) {
              // update the identity
              await txRepo.updateIdentity(id, tenantId, i)
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
            attributes,
          }

          this.log.trace({ payload }, `Creating new organization!`)

          // if it doesn't exists create it
          id = await this.repo.insert(tenantId, payload)

          // create identities
          for (const i of data.identities) {
            // add the identity
            await txRepo.addIdentity(id, tenantId, {
              ...i,
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
    await this.repo.addToSegments(
      tenantId,
      segmentId,
      orgs.map((org) => org.id),
    )
    await this.repo.addToMember(memberId, orgs)
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
        const txRepo = new OrganizationRepository(txStore, this.log)
        const txIntegrationRepo = new IntegrationRepository(txStore, this.log)

        const txService = new OrganizationService(txStore, this.log)

        const dbIntegration = await txIntegrationRepo.findById(integrationId)
        const segmentId = dbIntegration.segmentId

        // first try finding the organization using the remote sourceId
        let dbOrganization = primaryIdentity.sourceId
          ? await txRepo.findBySourceId(tenantId, segmentId, platform, primaryIdentity.sourceId)
          : null

        if (!dbOrganization) {
          // try finding the organization using verified identities
          for (const i of verifiedIdentities) {
            dbOrganization = await txRepo.findByVerifiedIdentity(tenantId, i)
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
            await txRepo.addToSyncRemote(
              dbOrganization.id,
              dbIntegration.id,
              primaryIdentity.sourceId,
            )
          }

          // check if sent primary identity already exists in the org
          const existingIdentities = await txRepo.getIdentities(dbOrganization.id, tenantId)

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
