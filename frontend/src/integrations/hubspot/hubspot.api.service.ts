import authAxios from '@/shared/axios/auth-axios';
import { MappableFields } from '@/integrations/hubspot/types/MappableFields';
import { HubspotOnboard } from '@/integrations/hubspot/types/HubspotOnboard';
import { HubspotLists } from '@/integrations/hubspot/types/HubspotLists';

export class HubspotApiService {
  static getMappableFields(): Promise<MappableFields> {
    return authAxios.get(
      '/hubspot-mappable-fields',
    )
      .then((response) => response.data);
  }

  static updateAttributes(): Promise<any> {
    return authAxios.post(
      '/hubspot-update-properties',
    )
      .then((response) => response.data);
  }

  static finishOnboard(data: HubspotOnboard): Promise<any> {
    return authAxios.post(
      '/hubspot-onboard',
      data,
    )
      .then((response) => response.data);
  }

  static syncMember(memberId: string): Promise<any> {
    return authAxios.post(
      '/hubspot-sync-member',
      {
        memberId,
      },
    )
      .then((response) => response.data);
  }

  static stopSyncMember(memberId: string): Promise<any> {
    return authAxios.post(
      '/hubspot-stop-sync-member',
      {
        memberId,
      },
    )
      .then((response) => response.data);
  }

  static syncOrganization(organizationId: string): Promise<any> {
    return authAxios.post(
      '/hubspot-sync-organization',
      {
        organizationId,
      },
    )
      .then((response) => response.data);
  }

  static stopSyncOrganization(organizationId: string): Promise<any> {
    return authAxios.post(
      '/hubspot-stop-sync-organization',
      {
        organizationId,
      },
    )
      .then((response) => response.data);
  }

  static getLists(): Promise<HubspotLists> {
    return authAxios.get(
      '/hubspot-get-lists',
    )
      .then((response) => response.data);
  }
}
