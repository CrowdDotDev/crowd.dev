// import github from './github/config';
// import git from './git/config';
// import groupsio from './groupsio/config';
import confluence from './confluence/config';

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
}

export const lfIntegrations: Record<string, IntegrationConfig> = {
  // github,
  // git,
  // groupsio,
  confluence,
};
