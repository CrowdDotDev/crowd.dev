import RedditConnect from './components/reddit-connect'
import RedditActivityMessage from '@/integrations/reddit/components/activity/reddit-activity-message'
import RedditActivityContent from '@/integrations/reddit/components/activity/reddit-activity-content'

export default {
  enabled: true,
  name: 'Reddit',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    "We're currently working on this integration.",
  image: '/images/reddit.svg',
  connectComponent: RedditConnect,
  activityMessage: RedditActivityMessage,
  activityContent: RedditActivityContent
}
