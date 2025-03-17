import { IntegrationConfig } from '@/config/integrations';
import HackernewsConnect from './components/hackernews-connect.vue';
import HackernewsParams from './components/hackernews-params.vue';

const image = new URL(
  '@/assets/images/integrations/hackernews.svg',
  import.meta.url,
).href;

const hackernews: IntegrationConfig = {
  key: 'hackernews',
  name: 'Hacker News',
  image,
  description:
    'Connect Hacker News to get posts as well as their comments mentioning your community.',
  connectComponent: HackernewsConnect,
  connectedParamsComponent: HackernewsParams,
  showProgress: false,
};

export default hackernews;
