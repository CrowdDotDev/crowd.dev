import { AutomationTypeConfig } from '@/modules/automation/config/automation-types';
import { FeatureFlag } from '@/featureFlag';
import AutomationsHubspotAction from './hubspot-action.vue';
import AutomationsHubspotTrigger from './hubspot-trigger.vue';
import AutomationsHubspotPaywall from './hubspot-paywall.vue';

export const hubspot: AutomationTypeConfig = {
  name: 'HubSpot',
  description: 'Send members or organizations to HubSpot',
  icon: '/images/integrations/hubspot.png',
  emptyScreen: {
    title: 'No HubSpot automations yet',
    body: 'Send members or organizations to HubSpot based on certain conditions.',
  },
  triggerText: 'Define the conditions that will trigger your HubSpot action.',
  actionText: 'Define which action will take place in HubSpot based on the defined conditions.',
  canCreate(store) {
    // const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
    // return hubspot.status === 'done' && FeatureFlag.isFlagEnabled('hubspot');
    return true;
  },
  disabled(store) {
    // const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
    // return FeatureFlag.isFlagEnabled('hubspot') && hubspot.status !== 'done';
    return false;
  },
  tooltip(store) {
    // const hubspot = CrowdIntegrations.getMappedConfig('hubspot', store);
    // if (FeatureFlag.isFlagEnabled('hubspot') && hubspot.status !== 'done') {
    //   return 'Connect with HubSpot via Integrations to enable this automation';
    // }
    // return null;
    return null;
  },
  actionButton() {
    const hubspotEnabeled = FeatureFlag.isFlagEnabled('hubspot');
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
    const hubspotEnabeled = FeatureFlag.isFlagEnabled('hubspot');
    if (hubspotEnabeled) {
      return null;
    }
    return AutomationsHubspotPaywall;
  },
  actionComponent: AutomationsHubspotAction,
  triggerComponent: AutomationsHubspotTrigger,
};
