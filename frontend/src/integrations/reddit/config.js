import RedditConnect from './components/reddit-connect.vue';

export default {
  enabled: true,
  name: 'Reddit',
  backgroundColor: '#ffd8ca',
  borderColor: '#ffd8ca',
  description:
    'Connect Reddit to sync posts and comments from selected subreddits.',
  image: '/images/integrations/reddit.svg',
  connectComponent: RedditConnect,
  url: (username) => `https://reddit.com/user/${username}`,
  chartColor: '#FF4500',
};
