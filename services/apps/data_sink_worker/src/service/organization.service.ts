import { IDbInsertOrganizationData } from '@/repo/organization.data'
import { OrganizationRepository } from '@/repo/organization.repo'
import { DbStore } from '@crowd/database'
import { Logger, LoggerBase } from '@crowd/logging'
import { IOrganization } from '@crowd/types'

export class OrganizationService extends LoggerBase {
  private readonly repo: OrganizationRepository

  constructor(private readonly store: DbStore, parentLog: Logger) {
    super(parentLog)

    this.repo = new OrganizationRepository(store, this.log)
  }

  public async findOrCreate(tenantId: string, data: IOrganization): Promise<string> {
    // find from cache by name
    let cached = await this.repo.findCacheByName(data.name)

    if (cached) {
      // if exists in cache update it
      await this.repo.updateCache(cached.id, {
        name: data.name,
        displayName: data.name,
        description: data.description || cached.description,
        location: data.location || cached.location,
        logo: data.logo || cached.logo,
        url: data.url || cached.url,
        github: data.github || cached.github,
        twitter: data.twitter || cached.twitter,
        website: data.website || cached.website,
      })
    } else {
      // if it doesn't exists in cache create it
      const insertData: IDbInsertOrganizationData = {
        name: data.name,
        displayName: data.name,
        description: data.description || null,
        location: data.location || null,
        logo: data.logo || null,
        url: data.url || null,
        github: data.github || null,
        twitter: data.twitter || null,
        website: data.website || null,
      }
      const id = await this.repo.insertCache(insertData)

      cached = {
        id,
        enriched: false,
        ...insertData,
      }
    }

    // now check if exists in this tenant
    const existing = await this.repo.findByName(tenantId, data.name)
    if (existing) {
      // if it does exists update it
      await this.repo.update(existing.id, {
        name: cached.name,
        displayName: cached.name,
        description: cached.description,
        location: cached.location,
        logo: cached.logo,
        url: cached.url,
        github: cached.github,
        twitter: cached.twitter,
        website: cached.website,
      })

      return existing.id
    } else {
      // if it doesn't exists create it
      const id = await this.repo.insert(tenantId, {
        name: cached.name,
        displayName: cached.name,
        description: cached.description,
        location: cached.location,
        logo: cached.logo,
        url: cached.url,
        github: cached.github,
        twitter: cached.twitter,
        website: cached.website,
      })

      return id
    }
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
}
