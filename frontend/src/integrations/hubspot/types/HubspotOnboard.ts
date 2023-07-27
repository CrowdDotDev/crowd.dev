import { HubspotEntity } from '@/integrations/hubspot/types/HubspotEntity';

export interface HubspotOnboard{
  enabledFor: HubspotEntity[];
  attributesMapping: {
    [HubspotEntity.MEMBERS]?: Record<string, string>;
    [HubspotEntity.ORGANIZATIONS]?: Record<string, string>;
  };
}
