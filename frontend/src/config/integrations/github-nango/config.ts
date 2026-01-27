import { IntegrationConfig } from '@/config/integrations';
import LfGithubSettingsDrawer from '@/config/integrations/github-nango/components/settings/github-settings-drawer.vue';
import GithubConnect from './components/github-connect.vue';
import GithubParams from './components/github-params.vue';
import GithubDropdown from './components/github-dropdown.vue';
import GithubMappedRepos from './components/github-mapped-repos.vue';

const image = new URL('@/assets/images/integrations/github.png', import.meta.url).href;

const github: IntegrationConfig = {
  key: 'github',
  name: 'GitHub (v2)',
  image,
  description:
    'Connect GitHub to sync profile information, stars, forks, pull requests, issues, and discussions.',
  connectComponent: GithubConnect,
  dropdownComponent: GithubDropdown,
  statusComponent: GithubParams,
  connectedParamsComponent: GithubParams,
  mappedReposComponent: GithubMappedRepos,
  settingComponent: LfGithubSettingsDrawer,
  showProgress: false,
  actionRequiredMessage: [
    {
      key: 'needs-reconnect',
      text: 'Reconnect your account to restore access.',
    },
    {
      key: 'mapping',
      text: 'Select repositories to track and map them to projects.',
    },
  ],
};

export default github;
