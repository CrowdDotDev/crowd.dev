import HubspotConnect from './components/hubspot-connect.vue';

export default {
  name: 'HubSpot',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description: 'Create a 2-way sync with HubSpot.',
  image:
    '/images/integrations/hubspot.svg',
  connectComponent: HubspotConnect,
  enabled: true,
  url: (username) => null,
  scale: true,
  chartColor: '#FF712E',
  showProfileLink: true,
  activityDisplay: {
    showLinkToUrl: true,
  },
  conversationDisplay: {
    replyContent: (conversation) => ({
      icon: 'ri-reply-line',
      copy: 'reply',
      number: conversation.activityCount - 1,
    }),
  },
  organization: {
    handle: (identity) => identity.name,
  },
};
