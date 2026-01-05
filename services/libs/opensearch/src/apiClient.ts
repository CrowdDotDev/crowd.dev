import axios from 'axios'

export interface ISearchSyncApiConfig {
  baseUrl: string
}

export class SearchSyncApiClient {
  private searchSyncApi

  constructor(config: ISearchSyncApiConfig) {
    this.searchSyncApi = axios.create({
      baseURL: config.baseUrl,
    })
  }

  public async triggerMemberSync(memberId: string): Promise<void> {
    if (!memberId) {
      throw new Error('memberId is required!')
    }

    await this.searchSyncApi.post('/sync/members', {
      memberId,
    })
  }

  public async triggerOrganizationMembersSync(
    organizationId: string,
    onboarding?: boolean,
    syncFrom: Date | null = null,
  ): Promise<void> {
    if (!organizationId) {
      throw new Error('organizationId is required!')
    }

    await this.searchSyncApi.post('/sync/organization/members', {
      organizationId,
      syncFrom,
    })
  }

  public async triggerRemoveMember(memberId: string): Promise<void> {
    if (!memberId) {
      throw new Error('memberId is required!')
    }

    await this.searchSyncApi.post('/cleanup/member', {
      memberId,
    })
  }

  public async triggerMemberCleanup(): Promise<void> {
    await this.searchSyncApi.post('/cleanup/members', {})
  }

  public async triggerOrganizationSync(
    organizationId: string,
    segmentIds?: string[],
  ): Promise<void> {
    if (!organizationId) {
      throw new Error('organizationId is required!')
    }

    await this.searchSyncApi.post('/sync/organizations', {
      organizationIds: [organizationId],
      segmentIds,
    })
  }

  public async triggerRemoveOrganization(organizationId: string): Promise<void> {
    if (!organizationId) {
      throw new Error('organizationId is required!')
    }

    await this.searchSyncApi.post('/cleanup/organization', {
      organizationId,
    })
  }

  public async triggerOrganizationCleanup(): Promise<void> {
    await this.searchSyncApi.post('/cleanup/organizations', {})
  }
}
