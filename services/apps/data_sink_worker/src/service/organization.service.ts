import mergeWith from 'lodash.mergewith'
import isEqual from 'lodash.isequal'
import IntegrationRepository from '@/repo/integration.repo'
import { IDbInsertOrganizationCacheData, IDbOrganization } from '@/repo/organization.data'
import { OrganizationRepository } from '@/repo/organization.repo'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase, getChildLogger } from '@crowd/logging'
import {
  IOrganization,
  IOrganizationCreateData,
  IOrganizationSocial,
  PlatformType,
} from '@crowd/types'
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

        data = this.normalizeSocialFields(data) as IOrganizationCreateData

        // Normalize the website URL if it exists
        if (data.website) {
          data.website = websiteNormalizer(data.website)
        }

        // find from cache by primary identity
        let cached = await txRepo.findCacheByName(primaryIdentity.name)

        if (cached) {
          // if exists in cache update it
          await txRepo.updateCache(cached.id, {
            name: primaryIdentity.name,
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
          const id = await txRepo.insertCache(insertData)

          cached = {
            id,
            enriched: false,
            ...insertData,
            attributes: {},
            weakIdentities: data.weakIdentities,
          }
        }

        // now check if exists in this tenant using the primary identity
        const existing = await txRepo.findByIdentity(tenantId, segmentId, primaryIdentity)

        const displayName = existing?.displayName ? existing?.displayName : primaryIdentity.name

        let attributes = existing?.attributes

        if (data.attributes) {
          const temp = mergeWith({}, existing?.attributes, data?.attributes)
          if (!isEqual(temp, existing?.attributes)) {
            attributes = temp
          }
        }

        let id

        if (existing) {
          await this.checkForStrongWeakIdentities(txRepo, tenantId, data, existing.id)

          // if it does exists update it
          await txRepo.update(existing.id, {
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
            weakIdentities: data.weakIdentities,
          })

          id = existing.id
        } else {
          await this.checkForStrongWeakIdentities(txRepo, tenantId, data)

          // if it doesn't exists create it
          id = await txRepo.insert(tenantId, {
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
            weakIdentities: data.weakIdentities,
          })
        }

        const identities = await txRepo.getIdentities(id, tenantId)

        for (const identity of data.identities) {
          const identityExists = identities.find(
            (i) => i.name === identity.name && i.platform === identity.platform,
          )

          if (!identityExists) {
            // add the identity
            await txRepo.addIdentity(id, tenantId, { ...identity, integrationId })
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

  private normalizeSocialFields(data: IOrganization): IOrganization | IOrganizationCreateData {
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
    orgs: IOrganization[],
  ): Promise<void> {
    await this.repo.addToSegments(
      tenantId,
      segmentId,
      orgs.map((org) => org.id),
    )
    await this.repo.addToMember(memberId, orgs)
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
    organization: IOrganizationCreateData,
  ): Promise<void> {
    this.log = getChildLogger('OrganizationService.processOrganizationEnrich', this.log, {
      integrationId,
      tenantId,
    })

    try {
      this.log.debug('Processing organization enrich.')

      if (!organization.identity?.name && !organization.attributes?.sourceId?.[platform]) {
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

        if (!dbOrganization && organization.identity.name) {
          // try finding the organization using name
          dbOrganization = await txRepo.findByIdentity(tenantId, segmentId, organization.identity)
        }

        if (dbOrganization) {
          this.log.trace({ organizationId: dbOrganization.id }, 'Found existing organization.')

          // set a record in organizationsSyncRemote to save the sourceId
          // we can't use organization.attributes because of segments
          if (sourceId) {
            await txRepo.addToSyncRemote(dbOrganization.id, dbIntegration.id, sourceId)
          }

          await this.findOrCreate(tenantId, segmentId, integrationId, organization)
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
