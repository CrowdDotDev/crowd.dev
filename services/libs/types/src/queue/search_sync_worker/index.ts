export enum SearchSyncWorkerQueueMessageType {
  SYNC_MEMBER = 'sync_member',
  SYNC_ORGANIZATION_MEMBERS = 'sync_organization_members',
  REMOVE_MEMBER = 'remove_member',
  CLEANUP_TENANT_MEMBERS = 'cleanup_tenant_members',

  SYNC_ORGANIZATION = 'sync_organization',
  REMOVE_ORGANIZATION = 'remove_organization',
  CLEANUP_TENANT_ORGANIZATIONS = 'cleanup_tenant_organizations',
}
