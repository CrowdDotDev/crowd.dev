import RedditConnect from './components/reddit-connect'

export default {
  enabled: true,
  name: 'Reddit',
  backgroundColor: '#ffd8ca',
  borderColor: '#ffd8ca',
  description:
    'Connect Reddit to sync posts and comments from selected subreddits.',
  image: '/images/integrations/reddit.svg',
  connectComponent: RedditConnect,
}
