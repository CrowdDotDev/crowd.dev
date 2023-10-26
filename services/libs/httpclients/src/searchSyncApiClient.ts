import axios from 'axios'
import { ISearchSyncApiConfig } from './types'

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
      memberIds: [memberId],
    })
  }

  public async triggerTenantMembersSync(tenantId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }

    await this.searchSyncApi.post('/sync/tenant/members', {
      tenantId,
    })
  }

  public async triggerOrganizationMembersSync(organizationId: string): Promise<void> {
    if (!organizationId) {
      throw new Error('organizationId is required!')
    }

    await this.searchSyncApi.post('/sync/organization/members', {
      organizationId,
    })
  }

  public async triggerRemoveMember(memberId: string): Promise<void> {
    if (!memberId) {
      throw new Error('memberId is required!')
    }

    await this.searchSyncApi.delete('/cleanup/member', {
      memberId,
    })
  }

  public async triggerMemberCleanup(tenantId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }

    await this.searchSyncApi.delete('/cleanup/tenant/members', {
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

  public async triggerOrganizationActivitiesSync(organizationId: string): Promise<void> {
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

    await this.searchSyncApi.delete('/cleanup/activity', {
      activityId,
    })
  }

  public async triggerActivityCleanup(tenantId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }

    await this.searchSyncApi.delete('/cleanup/tenant/activities', {
      tenantId,
    })
  }

  public async triggerOrganizationSync(organizationId: string): Promise<void> {
    if (!organizationId) {
      throw new Error('organizationId is required!')
    }

    await this.searchSyncApi.post('/sync/organizations', {
      organizationIds: [organizationId],
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

    await this.searchSyncApi.delete('/cleanup/organization', {
      organizationId,
    })
  }

  public async triggerOrganizationCleanup(tenantId: string): Promise<void> {
    if (!tenantId) {
      throw new Error('tenantId is required!')
    }

    await this.searchSyncApi.delete('/cleanup/tenant/organizations', {
      tenantId,
    })
  }
}
