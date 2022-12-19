import RedditConnect from './components/reddit-connect'
import RedditActivityMessage from '@/integrations/reddit/components/activity/reddit-activity-message'
import RedditActivityContent from '@/integrations/reddit/components/activity/reddit-activity-content'

export default {
  enabled: true,
  name: 'Reddit',
  backgroundColor: '#ffd8ca',
  borderColor: '#ffd8ca',
  description:
    'Connect Reddit to sync posts and comments from selected subreddits.',
  image: '/images/reddit.svg',
  connectComponent: RedditConnect,
  activityMessage: RedditActivityMessage,
  activityContent: RedditActivityContent
}
