import HubSpotBookCall from './components/hubspot-book-call.vue';

export default {
  enabled: false,
  name: 'HubSpot',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description: 'Create a 2-way sync with HubSpot.',
  image:
    '/images/integrations/hubspot.png',
  connectComponent: HubSpotBookCall,
};
