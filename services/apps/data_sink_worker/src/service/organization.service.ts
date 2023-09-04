import mergeWith from 'lodash.mergewith'
import isEqual from 'lodash.isequal'
import IntegrationRepository from '@/repo/integration.repo'
import { IDbInsertOrganizationData } from '@/repo/organization.data'
import { OrganizationRepository } from '@/repo/organization.repo'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import { IOrganization, IOrganizationSocial, PlatformType } from '@crowd/types'
import { websiteNormalizer } from '@crowd/common'

export class OrganizationService extends LoggerBase {
  private readonly repo: OrganizationRepository

  constructor(private readonly store: DbStore, parentLog: Logger) {
    super(parentLog)

    this.repo = new OrganizationRepository(store, this.log)
  }

  public async findOrCreate(
    tenantId: string,
    segmentId: string,
    data: IOrganization,
  ): Promise<string> {
    data = this.normalizeSocialFields(data)

    // Normalize the website URL if it exists
    if (data.website) {
      data.website = websiteNormalizer(data.website)
    }

    // find from cache by name
    let cached = await this.repo.findCacheByName(data.name)

    if (cached) {
      // if exists in cache update it
      await this.repo.updateCache(cached.id, {
        name: data.name,
        url: data.url || cached.url,
        description: data.description || cached.description,
        emails: data.emails || cached.emails,
        logo: data.logo || cached.logo,
        tags: data.tags || cached.tags,
        github: (data.github || cached.github) as IOrganizationSocial,
        twitter: (data.twitter || cached.twitter) as IOrganizationSocial,
        linkedin: (data.linkedin || cached.linkedin) as IOrganizationSocial,
        crunchbase: (data.crunchbase || cached.crunchbase) as IOrganizationSocial,
        employees: data.employees || cached.employees,
        location: data.location || cached.location,
        website: data.website || cached.website,
        type: data.type || cached.type,
        size: data.size || cached.size,
        headline: data.headline || cached.headline,
        industry: data.industry || cached.industry,
        founded: data.founded || cached.founded,
      })
    } else {
      // if it doesn't exists in cache create it
      const insertData: IDbInsertOrganizationData = {
        name: data.name,
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
      const id = await this.repo.insertCache(insertData)

      cached = {
        id,
        enriched: false,
        ...insertData,
        attributes: {},
      }
    }

    // now check if exists in this tenant
    const existing = await this.repo.findByName(tenantId, segmentId, data.name)

    const displayName = existing?.displayName ? existing?.displayName : data?.name

    let attributes = existing?.attributes

    if (data.attributes) {
      const temp = mergeWith({}, existing?.attributes, data?.attributes)
      if (!isEqual(temp, existing?.attributes)) {
        attributes = temp
      }
    }

    if (existing) {
      // if it does exists update it
      await this.repo.update(existing.id, {
        name: cached.name,
        displayName,
        url: cached.url,
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
      })

      return existing.id
    } else {
      // if it doesn't exists create it
      const id = await this.repo.insert(tenantId, {
        name: cached.name,
        displayName: cached.name,
        url: cached.url,
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
      })

      return id
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
        url: `crunchbase.com/organization/${data.linkedin}`,
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
    orgIds: string[],
  ): Promise<void> {
    await this.repo.addToSegments(tenantId, segmentId, orgIds)
    await this.repo.addToMember(memberId, orgIds)
  }

  public async findByDomain(
    tenantId: string,
    segmentId: string,
    domain: string,
  ): Promise<IOrganization> {
    return await this.repo.findByDomain(tenantId, segmentId, domain)
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

      if (!organization.name && !organization.attributes?.sourceId?.[platform]) {
        const errorMessage = `Organization can't be enriched. It is missing both name and attributes.sourceId[${platform}}] fields.`
        this.log.warn(errorMessage)
        return
      }

      await this.store.transactionally(async (txStore) => {
        const txRepo = new OrganizationRepository(txStore, this.log)
        const txIntegrationRepo = new IntegrationRepository(txStore, this.log)

        const dbIntegration = await txIntegrationRepo.findById(integrationId)
        const segmentId = dbIntegration.segmentId

        // first try finding the organization using the remote sourceId
        const sourceId = organization.attributes?.sourceId?.[platform]
        let dbOrganization = sourceId
          ? await txRepo.findBySourceId(tenantId, segmentId, platform, sourceId)
          : null

        if (!dbOrganization && organization.name) {
          // try finding the organization using name
          dbOrganization = await txRepo.findByName(tenantId, segmentId, organization.name)
        }

        if (dbOrganization) {
          this.log.trace({ organizationId: dbOrganization.id }, 'Found existing organization.')

          // set a record in organizationsSyncRemote to save the sourceId
          // we can't use organization.attributes because of segments
          if (sourceId) {
            await txRepo.addToSyncRemote(dbOrganization.id, dbIntegration.id, sourceId)
          }

          // send to findOrCreate with found organization's name, since we use the name field as the primary key
          await this.findOrCreate(tenantId, segmentId, {
            ...organization,
            name: dbOrganization.name,
          })
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
