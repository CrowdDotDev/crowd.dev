import { IntegrationConfig } from '@/config/integrations';
import HackernewsConnect from './components/hackernews-connect.vue';
import HackernewsParams from './components/hackernews-params.vue';

const hackernews: IntegrationConfig = {
  key: 'hackernews',
  name: 'Hacker News',
  image: '/src/assets/images/integrations/hackernews.svg',
  description:
    'Connect Hacker News to get posts as well as their comments mentioning your community.',
  connectComponent: HackernewsConnect,
  connectedParamsComponent: HackernewsParams,
  showProgress: false,
};

export default hackernews;
