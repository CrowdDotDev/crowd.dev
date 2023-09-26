export enum SearchSyncWorkerQueueMessageType {
  SYNC_MEMBER = 'sync_member',
  SYNC_TENANT_MEMBERS = 'sync_tenant_members',
  SYNC_ORGANIZATION_MEMBERS = 'sync_organization_members',
  REMOVE_MEMBER = 'remove_member',
  CLEANUP_TENANT_MEMBERS = 'cleanup_tenant_members',

  SYNC_ACTIVITY = 'sync_activity',
  SYNC_TENANT_ACTIVITIES = 'sync_tenant_activities',
  SYNC_ORGANIZATION_ACTIVITIES = 'sync_organization_activities',
  REMOVE_ACTIVITY = 'remove_activity',
  CLEANUP_TENANT_ACTIVITIES = 'cleanup_tenant_activities',

  SYNC_ORGANIZATION = 'sync_organization',
  SYNC_TENANT_ORGANIZATIONS = 'sync_tenant_organizations',
  REMOVE_ORGANIZATION = 'remove_organization',
  CLEANUP_TENANT_ORGANIZATIONS = 'cleanup_tenant_organizations',
}

export interface ISearchSyncWorkerEmitter {
  triggerMemberSync(tenantId: string, memberId: string): Promise<void>
  triggerTenantMembersSync(tenantId: string): Promise<void>
  triggerOrganizationMembersSync(organizationId: string): Promise<void>
  triggerRemoveMember(tenantId: string, memberId: string): Promise<void>
  triggerMemberCleanup(tenantId: string): Promise<void>
  triggerActivitySync(tenantId: string, activityId: string): Promise<void>
  triggerTenantActivitiesSync(tenantId: string): Promise<void>
  triggerOrganizationActivitiesSync(organizationId: string): Promise<void>
  triggerRemoveActivity(tenantId: string, activityId: string): Promise<void>
  triggerActivityCleanup(tenantId: string): Promise<void>
  triggerOrganizationSync(tenantId: string, organizationId: string): Promise<void>
  triggerTenantOrganizationSync(tenantId: string): Promise<void>
  triggerRemoveOrganization(tenantId: string, organizationId: string): Promise<void>
  triggerOrganizationCleanup(tenantId: string): Promise<void>
}
