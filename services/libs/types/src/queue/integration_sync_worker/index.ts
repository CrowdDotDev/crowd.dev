import { AutomationSyncTrigger } from '../../automations'

export enum IntegrationSyncWorkerQueueMessageType {
  SYNC_ALL_MARKED_MEMBERS = 'sync_all_marked_members',
  SYNC_MEMBER = 'sync_member',
  SYNC_ALL_MARKED_ORGANIZATIONS = 'sync_all_marked_organizations',
  SYNC_ORGANIZATION = 'sync_organization',
  ONBOARD_AUTOMATION = 'onboard_automation',
}

export interface IIntegrationSyncWorkerEmitter {
  triggerSyncMarkedMembers(tenantId: string, integrationId: string): Promise<void>

  triggerSyncMember(
    tenantId: string,
    integrationId: string,
    memberId: string,
    syncRemoteId: string,
  ): Promise<void>

  triggerOnboardAutomation(
    tenantId: string,
    integrationId: string,
    automationId: string,
    automationTrigger: AutomationSyncTrigger,
  ): Promise<void>

  triggerSyncMarkedOrganizations(tenantId: string, integrationId: string): Promise<void>

  triggerSyncOrganization(
    tenantId: string,
    integrationId: string,
    organizationId: string,
    syncRemoteId: string,
  ): Promise<void>
}
