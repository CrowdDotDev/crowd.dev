import { IntegrationConfig } from '@/config/integrations';
import GroupsioConnect from './components/groupsio-connect.vue';
import GroupsioParams from './components/groupsio-params.vue';
import GroupsioDropdown from './components/groupsio-dropdown.vue';
import LfGroupsioSettingsDrawer from './components/groupsio-settings-drawer.vue';

const image = new URL(
  '@/assets/images/integrations/groupsio.svg',
  import.meta.url,
).href;

const groupsio: IntegrationConfig = {
  key: 'groupsio',
  name: 'Groups.io',
  image,
  description: 'Connect Groups.io to sync groups and topics activity.',
  connectComponent: GroupsioConnect,
  connectedParamsComponent: GroupsioParams,
  dropdownComponent: GroupsioDropdown,
  settingComponent: LfGroupsioSettingsDrawer,
  showProgress: false,
};

export default groupsio;
