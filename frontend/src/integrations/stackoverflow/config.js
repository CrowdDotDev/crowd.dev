import StackOverflowConnect from './components/stackoverflow-connect'
import StackOverflowActivityMessage from './components/activity/stackoverflow-activity-message'
import StackOverflowActivityContent from './components/activity/stackoverflow-activity-content'

export default {
  enabled: true,
  name: 'Stack Overflow',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    "We're currently working on this integration.",
  image:
    'https://cdn-icons-png.flaticon.com/512/2111/2111628.png',
  connectComponent: StackOverflowConnect,
  activityMessage: StackOverflowActivityMessage,
  activityContent: StackOverflowActivityContent
}
