import { IntegrationConfig } from '@/config/integrations';
import { getImageUrlFromPath } from '@/utils/image-loader';
import GithubConnect from './components/github-connect.vue';
import GithubParams from './components/github-params.vue';
import GithubDropdown from './components/github-dropdown.vue';

const github: IntegrationConfig = {
  key: 'github',
  name: 'GitHub',
  image: getImageUrlFromPath('integrations/github.png'),
  description:
    'Connect GitHub to sync profile information, stars, forks, pull requests, issues, and discussions.',
  connectComponent: GithubConnect,
  dropdownComponent: GithubDropdown,
  connectedParamsComponent: GithubParams,
};

export default github;
