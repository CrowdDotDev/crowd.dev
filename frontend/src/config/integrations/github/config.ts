import { IntegrationConfig } from '@/config/integrations';
import GithubConnect from './components/connect/github-connect.vue';
import GithubStatus from './components/github-status.vue';
import GithubAction from './components/github-action.vue';

const github: IntegrationConfig = {
  key: 'github',
  name: 'GitHub',
  image: '/images/integrations/github.png',
  description: 'Connect GitHub to sync profile information, stars, forks, pull requests, issues, and discussions.',
  connectComponent: GithubConnect,
  statusComponent: GithubStatus,
  actionComponent: GithubAction,
};

export default github;
