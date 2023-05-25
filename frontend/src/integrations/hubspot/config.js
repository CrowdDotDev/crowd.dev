import HubSpotBookCall from './components/hubspot-book-call.vue';

export default {
  enabled: false,
  name: 'HubSpot',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description: 'Connect HubSpot account and allow crowd.dev attributes to be synced via Automations.',
  image:
    '/images/integrations/hubspot.png',
  connectComponent: HubSpotBookCall,
};
