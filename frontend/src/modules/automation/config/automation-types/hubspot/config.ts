import { AutomationTypeConfig } from '@/modules/automation/config/automation-types';
import { FeatureFlag } from '@/featureFlag';
import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import noOfActivities from '@/modules/member/config/filters/noOfActivities/config';
import activityType from '@/modules/member/config/filters/activityType/config';
import tags from '@/modules/member/config/filters/tags/config';
import noOfMembers from '@/modules/organization/config/filters/noOfMembers/config';
import headcount from '@/modules/organization/config/filters/headcount/config';
import industry from '@/modules/organization/config/filters/industry/config';
import seniorityLevel from '@/modules/member/config/filters/seniorityLevel/config';
import annualRevenue from '@/modules/organization/config/filters/annualRevenue/config';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import {
  HubspotAutomationTrigger,
} from '@/modules/automation/config/automation-types/hubspot/types/HubspotAutomationTrigger';
import { HubspotEntity } from '@/integrations/hubspot/types/HubspotEntity';
import AutomationsHubspotPaywall from './hubspot-paywall.vue';
import AutomationsHubspotTrigger from './hubspot-trigger.vue';
import AutomationsHubspotAction from './hubspot-action.vue';

export const hubspotMemberFilters: Record<string, FilterConfig> = {
  noOfActivities,
  activityType,
  seniorityLevel,
  tags,
};

export const hubspotOrganizationFilters: Record<string, FilterConfig> = {
  noOfActivities,
  noOfMembers,
  headcount,
  industry,
  annualRevenue,
};

export const hubspot: AutomationTypeConfig = {
  name: 'HubSpot',
  description: 'Send members or organizations to HubSpot',
  icon: '/images/integrations/hubspot.png',
  plan: 'Scale',
  featureFlag: FeatureFlag.flags.hubspot,
  emptyScreen: {
    title: 'No HubSpot automations yet',
    body: 'Send members or organizations to HubSpot based on certain conditions.',
  },
  triggerText: 'Define the conditions that will trigger your HubSpot action.',
  actionText: 'Define which action will take place in HubSpot based on the defined conditions.',
  canCreate(store) {
    const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
    return hubspot.status === 'done' && FeatureFlag.isFlagEnabled(FeatureFlag.flags.hubspot);
  },
  disabled(store) {
    const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
    return FeatureFlag.isFlagEnabled(FeatureFlag.flags.hubspot) && hubspot.status !== 'done';
  },
  tooltip(store) {
    const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
    if (FeatureFlag.isFlagEnabled(FeatureFlag.flags.hubspot) && hubspot.status !== 'done') {
      return 'Connect with HubSpot via Integrations to enable this automation';
    }
    return null;
  },
  actionButton() {
    const hubspotEnabeled = FeatureFlag.isFlagEnabled(FeatureFlag.flags.hubspot);
    if (hubspotEnabeled) {
      return null;
    }
    return {
      label: 'Upgrade plan',
      action: () => {
        window.open('https://cal.com/team/crowddotdev/custom-plan', '_blank');
      },
    };
  },
  paywallComponent() {
    const hubspotEnabeled = FeatureFlag.isFlagEnabled(FeatureFlag.flags.hubspot);
    if (hubspotEnabeled) {
      return null;
    }
    return AutomationsHubspotPaywall;
  },
  settingsMap(settings: any, trigger: string) {
    const { operator, list, data } = settings;

    let filters: Record<string, FilterConfig> = {};
    if (trigger === HubspotAutomationTrigger.MEMBER_ATTRIBUTE_MATCH) {
      filters = hubspotMemberFilters;
    }
    if (trigger === HubspotAutomationTrigger.ORGANIZATION_ATTRIBUTE_MATCH) {
      filters = hubspotOrganizationFilters;
    }

    const apiFilterData = list.map((property: string) => {
      const config: FilterConfig = filters[property];
      return config.apiFilterRenderer(data[property]);
    }).flat();
    return {
      ...settings,
      filter: {
        [operator]: apiFilterData,
      },
    };
  },
  enableGuard(automation: any, store: string) {
    const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
    const enabledFor = hubspot.settings?.enabledFor || [];
    if (automation.trigger === HubspotAutomationTrigger.MEMBER_ATTRIBUTE_MATCH) {
      return enabledFor.includes(HubspotEntity.MEMBERS);
    }
    if (automation.trigger === HubspotAutomationTrigger.ORGANIZATION_ATTRIBUTE_MATCH) {
      return enabledFor.includes(HubspotEntity.ORGANIZATIONS);
    }
    return true;
  },
  actionComponent: AutomationsHubspotAction,
  triggerComponent: AutomationsHubspotTrigger,
};
