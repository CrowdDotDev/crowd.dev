import config from '@/config';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import github from './github/config';
import githubNango from './github-nango/config';
import git from './git/config';
import groupsio from './groupsio/config';
import confluence from './confluence/config';
import jira from './jira/config';
import slack from './slack/config';
import discord from './discord/config';
import linkedin from './linkedin/config';
import twitter from './twitter/config';
import reddit from './reddit/config';
import hackernews from './hackernews/config';
import stackoverflow from './stackoverflow/config';
import gitlab from './gitlab/config';
import gerrit from './gerrit/config';
import discourse from './discourse/config';
import devto from './devto/config';

export interface IntegrationConfig {
  key: string; // Unique key for the integration
  name: string; // Display name of the integration
  image: string; // Image URL for the integration
  description: string; // Description of the integration
  connectComponent?: Vue.Component; // Component rendered for user to connect integration
  actionComponent?: Vue.Component; // Component rendered when integration needs user action
  statusComponent?: Vue.Component; // Component rendered to show integration status
  connectedParamsComponent?: Vue.Component; // Component rendered to show connected integration params (repositories, channels)
  dropdownComponent?: Vue.Component; // Component rendered inside dropdown for extra options
  showProgress: boolean; // Show progress bar when connecting
}

export const getGithubIntegration = () => {
  if (config.env === 'local') return githubNango;

  if (config.env === 'staging') {
    const useGitHubNango = localStorage.getItem('useGitHubNango') === 'true';

    return useGitHubNango ? githubNango : github;
  }

  const authStore = useAuthStore();
  const userId = authStore.user?.id;

  return config.permissions.teamUserIds?.includes(userId)
    ? githubNango
    : github;
};

export const lfIntegrations: () => Record<string, IntegrationConfig> = () => ({
  github: getGithubIntegration(),
  git,
  groupsio,
  confluence,
  jira,
  slack,
  discord,
  linkedin,
  twitter,
  reddit,
  hackernews,
  stackoverflow,
  gitlab,
  gerrit,
  discourse,
  devto,
});
