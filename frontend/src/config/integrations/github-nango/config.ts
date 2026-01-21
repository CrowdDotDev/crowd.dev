import { IntegrationConfig } from '@/config/integrations'
import LfGithubSettingsDrawer from '@/config/integrations/github-nango/components/settings/github-settings-drawer.vue'
// For now we will be referencing the connect component from the github (old) integration
import GithubConnect from '@/config/integrations/github/components/github-connect.vue'
import GithubParams from '@/config/integrations/github/components/github-params.vue'
import GithubStatus from '@/config/integrations/github/components/github-status.vue'
import GithubDropdown from './components/github-dropdown.vue'
import GithubMappedRepos from './components/github-mapped-repos.vue'

const image = new URL('@/assets/images/integrations/github.png', import.meta.url).href

const github: IntegrationConfig = {
  key: 'github',
  name: 'GitHub (v2)',
  image,
  description:
    'Connect GitHub to sync profile information, stars, forks, pull requests, issues, and discussions.',
  connectComponent: GithubConnect,
  dropdownComponent: GithubDropdown,
  statusComponent: GithubStatus,
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
}

export default github
