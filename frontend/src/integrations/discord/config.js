import DiscordConnect from './components/discord-connect'
import DiscordActivityContent from './components/activity/discord-activity-content'

export default {
  enabled: true,
  name: 'Discord',
  backgroundColor: '#dee0fc',
  borderColor: '#dee0fc',
  description:
    'Connect Discord to sync messages, threads, forum channels, and new joiners.',
  image:
    'https://cdn-icons-png.flaticon.com/512/5968/5968756.png',
  connectComponent: DiscordConnect,
  activityContent: DiscordActivityContent
}
