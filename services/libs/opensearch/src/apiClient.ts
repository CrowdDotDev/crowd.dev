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

  public async triggerMemberSync(
    memberId: string,
    opts: { withAggs?: boolean } = {},
  ): Promise<void> {
    if (!memberId) {
      throw new Error('memberId is required!')
    }

    await this.searchSyncApi.post('/sync/members', {
      memberId,
      ...opts,
    })
  }

  public async triggerMembersSync(): Promise<void> {
    await this.searchSyncApi.post('/sync/tenant/members', {})
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
    await this.searchSyncApi.post('/cleanup/tenant/members', {})
  }

  public async triggerOrganizationSync(
    organizationId: string,
    segmentIds?: string[],
    opts: { withAggs?: boolean } = { withAggs: true },
  ): Promise<void> {
    if (!organizationId) {
      throw new Error('organizationId is required!')
    }

    await this.searchSyncApi.post('/sync/organizations', {
      organizationIds: [organizationId],
      segmentIds,
      ...opts,
    })
  }

  public async triggerOrganizationsSync(): Promise<void> {
    await this.searchSyncApi.post('/sync/tenant/organizations', {})
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
    await this.searchSyncApi.post('/cleanup/tenant/organizations', {})
  }
}
