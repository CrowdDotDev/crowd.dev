export enum SearchSyncWorkerQueueMessageType {
  SYNC_MEMBER = 'sync_member',
  SYNC_MEMBERS = 'sync_members',
  SYNC_ORGANIZATION_MEMBERS = 'sync_organization_members',
  REMOVE_MEMBER = 'remove_member',
  CLEANUP_MEMBERS = 'cleanup_members',

  SYNC_ORGANIZATION = 'sync_organization',
  SYNC_ORGANIZATIONS = 'sync_organizations',
  REMOVE_ORGANIZATION = 'remove_organization',
  CLEANUP_ORGANIZATIONS = 'cleanup_organizations',
}
