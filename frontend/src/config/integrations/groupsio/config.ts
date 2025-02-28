import { IntegrationConfig } from '@/config/integrations';
import { getImageUrlFromPath } from '@/utils/image-loader';
import GroupsioConnect from './components/groupsio-connect.vue';
import GroupsioParams from './components/groupsio-params.vue';
import GroupsioDropdown from './components/groupsio-dropdown.vue';

const groupsio: IntegrationConfig = {
  key: 'groupsio',
  name: 'Groups.io',
  image: getImageUrlFromPath('integrations/groupsio.svg'),
  description: 'Connect Groups.io to sync groups and topics activity.',
  connectComponent: GroupsioConnect,
  connectedParamsComponent: GroupsioParams,
  dropdownComponent: GroupsioDropdown,
  showProgress: false,
};

export default groupsio;
