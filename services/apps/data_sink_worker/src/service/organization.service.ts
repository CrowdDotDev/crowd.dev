import mergeWith from 'lodash.mergewith'
import isEqual from 'lodash.isequal'
import IntegrationRepository from '../repo/integration.repo'
import { IDbCacheOrganization, IDbInsertOrganizationCacheData } from '../repo/organization.data'
import { OrganizationRepository } from '../repo/organization.repo'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { IOrganization, IOrganizationSocial, PlatformType } from '@crowd/types'
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
    if (
      !data.identities ||
      data.identities.length === 0 ||
      !data.identities[0].name ||
      !data.identities[0].platform
    ) {
      const message = `Missing organization identity while creating/updating organization!`
      this.log.error(data, message)
      throw new Error(message)
    }

    try {
      const id = await this.store.transactionally(async (txStore) => {
        const txRepo = new OrganizationRepository(txStore, this.log)

        const primaryIdentity = data.identities[0]

        data = this.normalizeSocialFields(data) as IOrganization

        // Normalize the website URL if it exists
        if (data.website) {
          data.website = websiteNormalizer(data.website)
        }

        this.log.trace(`Checking organization exists in cache..`)

        // find from cache by website if we have one
        let cached: IDbCacheOrganization | null = null
        let createCacheIdentity = false
        if (data.website) {
          cached = await txRepo.findCacheByWebsite(data.website)

          if (cached && !cached.names.includes(primaryIdentity.name)) {
            createCacheIdentity = true
          }
        }

        if (!cached) {
          cached = await txRepo.findCacheByName(primaryIdentity.name)
        }

        if (cached) {
          this.log.trace({ cached }, `Organization exists in cache!`)

          // if exists in cache update it
          const updateData: Partial<IOrganization> = {}
          // no need to update name since it's aka primary key
          const fields = [
            'url',
            'description',
            'emails',
            'logo',
            'tags',
            'github',
            'twitter',
            'linkedin',
            'crunchbase',
            'employees',
            'location',
            'website',
            'type',
            'size',
            'headline',
            'industry',
            'founded',
          ]
          fields.forEach((field) => {
            if (data[field] && !isEqual(data[field], cached[field])) {
              updateData[field] = data[field]
            }
          })
          if (Object.keys(updateData).length > 0) {
            await this.repo.updateCache(
              cached.id,
              updateData,
              createCacheIdentity ? primaryIdentity.name : undefined,
            )
            cached = { ...cached, ...updateData } // Update the cached data with the new data
          }
        } else {
          this.log.trace({ cached }, `Organization doesn't exist in cache!`)

          // if it doesn't exists in cache create it
          const insertData: IDbInsertOrganizationCacheData = {
            name: primaryIdentity.name,
            url: data.url || null,
            description: data.description || null,
            emails: data.emails || null,
            logo: data.logo || null,
            tags: data.tags || null,
            github: (data.github || null) as IOrganizationSocial,
            twitter: (data.twitter || null) as IOrganizationSocial,
            linkedin: (data.linkedin || null) as IOrganizationSocial,
            crunchbase: (data.crunchbase || null) as IOrganizationSocial,
            employees: data.employees || null,
            location: data.location || null,
            website: data.website || null,
            type: data.type || null,
            size: data.size || null,
            headline: data.headline || null,
            industry: data.industry || null,
            founded: data.founded || null,
          }

          this.log.trace({ insertData }, ` Creating cache entry!`)

          const id = await txRepo.insertCache(insertData)

          cached = {
            id,
            enriched: false,
            ...insertData,
            attributes: {},
            names: [primaryIdentity.name],
          }
        }

        let existing

        // check organization exists by domain
        if (cached.website) {
          existing = await txRepo.findByDomain(tenantId, cached.website)

          // also check domain in identities
          if (!existing) {
            existing = await txRepo.findByIdentity(tenantId, {
              name: websiteNormalizer(cached.website),
              platform: 'email',
            })
          }
        }

        // if domain is not found, check existence by sent identities
        if (!existing) {
          existing = await txRepo.findByIdentity(tenantId, primaryIdentity)
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
          await this.checkForStrongWeakIdentities(txRepo, tenantId, data, existing.id)

          // if it does exists update it
          const updateData: Partial<IOrganization> = {}
          const fields = [
            'displayName',
            'description',
            'emails',
            'logo',
            'tags',
            'github',
            'twitter',
            'linkedin',
            'crunchbase',
            'employees',
            'location',
            'website',
            'type',
            'size',
            'headline',
            'industry',
            'founded',
            'attributes',
            'weakIdentities',
          ]
          fields.forEach((field) => {
            if (!existing[field] && cached[field]) {
              updateData[field] = cached[field]
            }
          })

          this.log.trace({ updateData }, `Updating organization!`)

          if (Object.keys(updateData).length > 0) {
            await this.repo.update(existing.id, updateData)
          }

          id = existing.id
        } else {
          this.log.trace(`Organization wasn't found via website or identities.`)

          await this.checkForStrongWeakIdentities(txRepo, tenantId, data)

          const payload = {
            displayName: primaryIdentity.name,
            description: cached.description,
            emails: cached.emails,
            logo: cached.logo,
            tags: cached.tags,
            github: cached.github,
            twitter: cached.twitter,
            linkedin: cached.linkedin,
            crunchbase: cached.crunchbase,
            employees: cached.employees,
            location: cached.location,
            website: cached.website,
            type: cached.type,
            size: cached.size,
            headline: cached.headline,
            industry: cached.industry,
            founded: cached.founded,
            attributes,
            weakIdentities: data.weakIdentities,
          }

          this.log.trace({ payload }, `Creating new organization!`)

          // if it doesn't exists create it
          id = await this.repo.insert(tenantId, payload)
        }

        const identities = await txRepo.getIdentities(id, tenantId)

        // create identities with incoming website
        if (data.website) {
          data.identities.push({
            name: websiteNormalizer(data.website),
            platform: 'email',
            integrationId,
          })
        }

        for (const identity of data.identities) {
          const identityExists = identities.find(
            (i) => i.name === identity.name && i.platform === identity.platform,
          )

          if (!identityExists) {
            // add the identity
            await txRepo.addIdentity(id, tenantId, { ...identity, integrationId })
          }
        }

        await txRepo.linkCacheAndOrganization(cached.id, id)

        return id
      })

      return id
    } catch (err) {
      this.log.error(err, 'Error while upserting an organization!')
      throw err
    }
  }

  private async checkForStrongWeakIdentities(
    repo: OrganizationRepository,
    tenantId: string,
    data: IOrganization,
    organizationId?: string,
  ): Promise<void> {
    // convert non-existing weak identities to strong ones
    if (data.weakIdentities && data.weakIdentities.length > 0) {
      const strongNotOwnedIdentities = await repo.findIdentities(
        tenantId,
        data.weakIdentities,
        organizationId,
      )

      const strongIdentities = []

      // find weak identities in the payload that doesn't exist as a strong identity yet
      for (const weakIdentity of data.weakIdentities) {
        if (!strongNotOwnedIdentities.has(`${weakIdentity.platform}:${weakIdentity.name}`)) {
          strongIdentities.push(weakIdentity)
        }
      }

      // exclude identities that are converted to a strong one from weakIdentities
      if (strongIdentities.length > 0) {
        data.weakIdentities = data.weakIdentities.filter(
          (i) =>
            strongIdentities.find((s) => s.platform === i.platform && s.name === i.name) ===
            undefined,
        )

        // push new strong identities to the payload
        for (const identity of strongIdentities) {
          if (
            data.identities.find(
              (i) => i.platform === identity.platform && i.name === identity.name,
            ) === undefined
          ) {
            data.identities.push(identity)
          }
        }
      }
    }
  }

  private normalizeSocialFields(data: IOrganization): IOrganization {
    if (typeof data.twitter === 'string') {
      data.twitter = {
        handle: data.twitter,
      }
    }

    if (typeof data.linkedin === 'string') {
      data.linkedin = {
        handle: data.linkedin,
        url: `linkedin.com/company/${data.linkedin}`,
      }
    }

    if (typeof data.crunchbase === 'string') {
      data.crunchbase = {
        handle: data.crunchbase,
        url: `crunchbase.com/organization/${data.crunchbase}`,
      }
    }

    if (typeof data.github === 'string') {
      data.github = {
        handle: data.github,
      } as IOrganizationSocial
    }

    return data
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

      if (
        organization.identities.length === 0 ||
        (!organization.identities[0].name && !organization.identities[0].sourceId)
      ) {
        const errorMessage = `Organization can't be enriched. It either doesn't have any identity or sent identities are missing name or sourceId fields.`
        this.log.warn(errorMessage)
        return
      }

      const primaryIdentity = organization.identities[0]

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

        if (!dbOrganization && primaryIdentity.name) {
          // try finding the organization using name
          dbOrganization = await txRepo.findInIdentityNames(tenantId, primaryIdentity.name)
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

          const primaryIdentityExists = existingIdentities.find(
            (i) => i.name === primaryIdentity.name && i.platform === primaryIdentity.platform,
          )

          // if it doesn't exist yet, append existing identities to the payload
          // so that findOrCreate can find the organization to update
          if (!primaryIdentityExists) {
            // we add to the start of the array, because findOrCreate checks the first item in identities as primary identity
            organization.identities.unshift(...existingIdentities)
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
