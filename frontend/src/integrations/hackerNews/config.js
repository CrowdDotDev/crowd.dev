import HackerNewsConnect from './components/hackerNews-connect'
import HackerNewsActivityMessage from './components/activity/hackerNews-activity-message'
import HackerNewsActivityContent from './components/activity/hackerNews-activity-content'

export default {
  enabled: true,
  name: 'Hacker News',
  backgroundColor: '#E5E7EB',
  borderColor: '#E5E7EB',
  description:
    'Connect Hacker News get posts that mention your community and their comments.',
  image:
    '/images/hackernews.svg',
  connectComponent: HackerNewsConnect,
  activityMessage: HackerNewsActivityMessage,
  activityContent: HackerNewsActivityContent
}
