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

  public async triggerMemberSync(memberId: string, opts?: { withAggs?: boolean }): Promise<void> {
    if (!memberId) {
      throw new Error('memberId is required!')
    }

    await this.searchSyncApi.post('/sync/members', {
      memberId,
      ...opts,
    })
  }

  public async triggerOrganizationMembersSync(
    tenantId: string,
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

  public async triggerMemberCleanup(tenantId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }

    await this.searchSyncApi.post('/cleanup/tenant/members', {
      tenantId,
    })
  }

  public async triggerActivitySync(activityId: string): Promise<void> {
    if (!activityId) {
      throw new Error('activityId is required!')
    }

    await this.searchSyncApi.post('/sync/activities', {
      activityIds: [activityId],
    })
  }

  public async triggerTenantActivitiesSync(tenantId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }

    await this.searchSyncApi.post('/sync/tenant/activities', {
      tenantId,
    })
  }

  public async triggerOrganizationActivitiesSync(
    tenantId: string,
    organizationId: string,
  ): Promise<void> {
    if (!organizationId) {
      throw new Error('organizationId is required!')
    }

    await this.searchSyncApi.post('/sync/organization/activities', {
      organizationId,
    })
  }

  public async triggerRemoveActivity(activityId: string): Promise<void> {
    if (!activityId) {
      throw new Error('activityId is required!')
    }

    await this.searchSyncApi.post('/cleanup/activity', {
      activityId,
    })
  }

  public async triggerActivityCleanup(tenantId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }

    await this.searchSyncApi.post('/cleanup/tenant/activities', {
      tenantId,
    })
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

  public async triggerTenantOrganizationSync(tenantId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }

    await this.searchSyncApi.post('/sync/tenant/organizations', {
      tenantId,
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

  public async triggerOrganizationCleanup(tenantId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }

    await this.searchSyncApi.post('/cleanup/tenant/organizations', {
      tenantId,
    })
  }
}
