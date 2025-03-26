import { IntegrationConfig } from '@/config/integrations';
import GithubConnect from './components/github-connect.vue';
import GithubParams from './components/github-params.vue';
import GithubDropdown from './components/github-dropdown.vue';

const image = new URL(
  '@/assets/images/integrations/github.png',
  import.meta.url,
).href;

const github: IntegrationConfig = {
  key: 'github-nango',
  name: 'GitHub (v2)',
  image,
  description:
    'Connect GitHub to sync profile information, stars, forks, pull requests, issues, and discussions.',
  connectComponent: GithubConnect,
  dropdownComponent: GithubDropdown,
  connectedParamsComponent: GithubParams,
};

export default github;
