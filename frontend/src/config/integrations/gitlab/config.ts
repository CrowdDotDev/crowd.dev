import { IntegrationConfig } from '@/config/integrations';
import GitlabConnect from './components/gitlab-connect.vue';
import GitlabParams from './components/gitlab-params.vue';
import GitlabAction from './components/gitlab-action.vue';
import GitlabStatus from './components/gitlab-status.vue';

const gitlab: IntegrationConfig = {
  key: 'gitlab',
  name: 'GitLab',
  image: '/images/integrations/gitlab.png',
  description: 'Connect GitLab to sync profile information, merge requests, issues, and more.',
  connectComponent: GitlabConnect,
  connectedParamsComponent: GitlabParams,
  actionComponent: GitlabAction,
  statusComponent: GitlabStatus,
};

export default gitlab;
