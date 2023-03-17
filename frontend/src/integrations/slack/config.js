import SlackConnect from './components/slack-connect'

export default {
  enabled: true,
  name: 'Slack',
  backgroundColor: '#FFFFFF',
  borderColor: '#E5E7EB',
  description:
    'Connect Slack to sync messages, threads, and new joiners.',
  image:
    'https://cdn-icons-png.flaticon.com/512/3800/3800024.png',
  connectComponent: SlackConnect
}
