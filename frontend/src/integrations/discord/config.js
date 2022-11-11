import DiscordConnect from './components/discord-connect'
import DiscordActivityMessage from './components/activity/discord-activity-message'
import DiscordActivityContent from './components/activity/discord-activity-content'
import DiscordActivityChannel from './components/activity/discord-activity-channel'

export default {
  enabled: true,
  name: 'Discord',
  backgroundColor: '#dee0fc',
  borderColor: '#dee0fc',
  description:
    'Connect Discord to sync messages, threads, and new joiners.',
  image:
    'https://cdn-icons-png.flaticon.com/512/5968/5968756.png',
  connectComponent: DiscordConnect,
  activityMessage: DiscordActivityMessage,
  activityContent: DiscordActivityContent,
  activityChannel: DiscordActivityChannel
}
