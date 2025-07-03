import { IntegrationConfig } from '@/config/integrations';
import GithubConnect from './components/connect/github-connect.vue';
import GithubStatus from './components/github-status.vue';
import GithubAction from './components/github-action.vue';
import GithubParams from './components/github-params.vue';
import GithubMappedRepos from './components/github-mapped-repos.vue';

const image = new URL(
  '@/assets/images/integrations/github.png',
  import.meta.url,
).href;

const github: IntegrationConfig = {
  key: 'github',
  name: 'GitHub',
  image,
  description:
    'Connect GitHub to sync profile information, stars, forks, pull requests, issues, and discussions.',
  connectComponent: GithubConnect,
  statusComponent: GithubStatus,
  actionComponent: GithubAction,
  connectedParamsComponent: GithubParams,
  mappedReposComponent: GithubMappedRepos,
  showProgress: true,
};

export default github;
