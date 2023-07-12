import HubSpotBookCall from './components/hubspot-book-call.vue';

export default {
  name: 'HubSpot',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description: 'Create a 2-way sync with HubSpot.',
  image:
    '/images/integrations/hubspot.png',
  connectComponent: HubSpotBookCall,
  enabled: true,
  url: (username) => null,
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
};
