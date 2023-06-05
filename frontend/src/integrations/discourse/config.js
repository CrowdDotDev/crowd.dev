import DiscourseConnect from './components/discourse-connect.vue';

export default {
  enabled: true,
  name: 'Discourse',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  chartColor: '#FFDE92',
  description:
    'Connect Discourse to sync topics, posts, and replies from your account forums.',
  image: '/images/integrations/discourse.png',
  connectComponent: DiscourseConnect,
  activityDisplay: {
    showLinkToUrl: true,
  },
  url: (attributes) => attributes.url.discourse,
};
