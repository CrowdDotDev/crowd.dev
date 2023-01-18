import LinkedInConnect from './components/linkedin-connect'
import LinkedInActivityMessage from '@/integrations/linkedin/components/activity/linkedin-activity-message'
import LinkedInActivityContent from '@/integrations/linkedin/components/activity/linkedin-activity-content'

export default {
  enabled: true,
  name: 'LinkedIn',
  backgroundColor: '#D4E1F0',
  borderColor: '#D4E1F0',
  description:
    "Connect LinkedIn to sync comments and reactions from your organization's posts.",
  image: '/images/integrations/linkedin.png',
  connectComponent: LinkedInConnect,
  activityMessage: LinkedInActivityMessage,
  activityContent: LinkedInActivityContent
}
