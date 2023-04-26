import DiscordConnect from './components/discord-connect.vue';

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
  chartColor: '#6875FF',
};
