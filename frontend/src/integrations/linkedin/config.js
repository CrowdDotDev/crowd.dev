import LinkedinConnect from '@/integrations/linkedin/components/linkedin-connect.vue'

export default {
  enabled: true,
  name: 'LinkedIn',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description:
    'Connect LinkedIn to sync posts and comments from your organizations.',
  image: '/images/integrations/linkedin.png',
  connectComponent: LinkedinConnect
}
