import { AuthService } from '@/modules/auth/services/auth.service';
import authAxios from '@/shared/axios/auth-axios';
import { MappableFields } from '@/integrations/hubspot/types/MappableFields';
import { HubspotOnboard } from '@/integrations/hubspot/types/HubspotOnboard';
import { HubspotLists } from '@/integrations/hubspot/types/HubspotLists';

export class HubspotApiService {
  static getMappableFields(): Promise<MappableFields> {
    const tenantId = AuthService.getTenantId();

    return authAxios.get(
      `/tenant/${tenantId}/hubspot-mappable-fields`,
    )
      .then((response) => response.data);
  }

  static updateAttributes(): Promise<any> {
    const tenantId = AuthService.getTenantId();
    return authAxios.post(
      `/tenant/${tenantId}/hubspot-update-properties`,
    )
      .then((response) => response.data);
  }

  static finishOnboard(data: HubspotOnboard): Promise<any> {
    const tenantId = AuthService.getTenantId();

    return authAxios.post(
      `/tenant/${tenantId}/hubspot-onboard`,
      data,
    )
      .then((response) => response.data);
  }

  static syncMember(memberId: string): Promise<any> {
    const tenantId = AuthService.getTenantId();

    return authAxios.post(
      `/tenant/${tenantId}/hubspot-sync-member`,
      {
        memberId,
      },
    )
      .then((response) => response.data);
  }

  static stopSyncMember(memberId: string): Promise<any> {
    const tenantId = AuthService.getTenantId();

    return authAxios.post(
      `/tenant/${tenantId}/hubspot-stop-sync-member`,
      {
        memberId,
      },
    )
      .then((response) => response.data);
  }

  static syncOrganization(organizationId: string): Promise<any> {
    const tenantId = AuthService.getTenantId();

    return authAxios.post(
      `/tenant/${tenantId}/hubspot-sync-organization`,
      {
        organizationId,
      },
    )
      .then((response) => response.data);
  }

  static stopSyncOrganization(organizationId: string): Promise<any> {
    const tenantId = AuthService.getTenantId();

    return authAxios.post(
      `/tenant/${tenantId}/hubspot-stop-sync-organization`,
      {
        organizationId,
      },
    )
      .then((response) => response.data);
  }

  static getLists(): Promise<HubspotLists> {
    const tenantId = AuthService.getTenantId();

    return authAxios.get(
      `/tenant/${tenantId}/hubspot-get-lists`,
    )
      .then((response) => response.data);
  }
}
