import GitConnect from './components/git-connect.vue';

export default {
  enabled: true,
  name: 'Git',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    'Connect Git to sync commit activities from your repos.',
  image:
    '/images/integrations/git.png',
  connectComponent: GitConnect,
  url: (username) => `https://github.com/${username}`,
  chartColor: '#E5512C',
};
