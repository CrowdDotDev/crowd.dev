import { IntegrationConfig } from '@/config/integrations';
import { getImageUrlFromPath } from '@/utils/image-loader';
import JiraConnect from './components/jira-connect.vue';
import JiraParams from './components/jira-params.vue';
import JiraDropdown from './components/jira-dropdown.vue';

const jira: IntegrationConfig = {
  key: 'jira',
  name: 'Jira',
  image: getImageUrlFromPath('integrations/jira.png'),
  description: 'Connect Jira to sync issues activities from your projects.',
  connectComponent: JiraConnect,
  connectedParamsComponent: JiraParams,
  dropdownComponent: JiraDropdown,
  showProgress: false,
};

export default jira;
