import { IntegrationConfig } from '@/config/integrations';
// import { getImageUrlFromPath } from '@/utils/image-loader';
import GithubConnect from './components/connect/github-connect.vue';
import GithubStatus from './components/github-status.vue';
import GithubAction from './components/github-action.vue';
import GithubParams from './components/github-params.vue';

const image = new URL(
  '@/assets/images/integrations/github.png',
  import.meta.url,
).href;

const github: IntegrationConfig = {
  key: 'github',
  name: 'GitHub',
  image, // getImageUrlFromPath('integrations/github.png'),
  description:
    'Connect GitHub to sync profile information, stars, forks, pull requests, issues, and discussions.',
  connectComponent: GithubConnect,
  statusComponent: GithubStatus,
  actionComponent: GithubAction,
  connectedParamsComponent: GithubParams,
  showProgress: true,
};

export default github;
