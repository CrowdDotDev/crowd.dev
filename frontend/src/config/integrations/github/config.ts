import { IntegrationConfig } from '@/config/integrations';
import AppGithubSettingsDrawer from '@/config/integrations/github/components/settings/github-settings-drawer.vue';
import GithubConnect from './components/connect/github-connect.vue';
import GithubStatus from './components/github-status.vue';
import GithubAction from './components/github-action.vue';
import GithubParams from './components/github-params.vue';
import GithubDropdown from '../github-nango/components/github-dropdown.vue';

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
  dropdownComponent: GithubDropdown,
  settingComponent: AppGithubSettingsDrawer,
  connectedParamsComponent: GithubParams,
  showProgress: true,
};

export default github;
