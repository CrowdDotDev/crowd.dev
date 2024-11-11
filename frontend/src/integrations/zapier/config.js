
export default {
  enabled: true,
  name: 'Zapier',
  backgroundColor: '#FFFFFF',
  borderColor: '#FFFFFF',
  description: 'Use Zapier to connect LFX with 5,000+ apps.',
  image:
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRjwkLT9PbSES0VK7HH2KbXxWdH8oc7k7oIJA&s',
  url: () => null,
  chartColor: '#FF9676',
  showProfileLink: true,
  activityDisplay: {
    showLinkToUrl: true,
  },
  conversationDisplay: {
    replyContent: (conversation) => ({
      icon: 'ri-reply-line',
      copy: 'reply',
      number: conversation.activityCount - 1,
    }),
  },
};
