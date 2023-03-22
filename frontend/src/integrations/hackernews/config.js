import HackerNewsConnect from './components/hackerNews-connect'

export default {
  enabled: true,
  name: 'Hacker News',
  backgroundColor: '#ffdecf',
  borderColor: '#ffdecf',
  description:
    'Connect Hacker News to get posts as well as their comments mentioning your community.',
  image: '/images/integrations/hackernews.svg',
  connectComponent: HackerNewsConnect
}
