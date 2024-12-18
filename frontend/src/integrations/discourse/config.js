export default {
  enabled: true,
  name: 'Discourse',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  chartColor: '#FFDE92',
  description:
    'Connect Discourse to sync topics, posts, and replies from your account forums.',
  onboard: {
    description: 'Sync topics, posts, and replies from your account forums.',
  },
  image: '/images/integrations/discourse.png',
  urlPrefix: 'https://meta.discourse.org/u/',
  activityDisplay: {
    showLinkToUrl: true,
  },
  url: ({ attributes }) => attributes?.url?.discourse,
};
