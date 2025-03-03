import { IntegrationConfig } from '@/config/integrations';
import GerritConnect from './components/gerrit-connect.vue';
import GerritParams from './components/gerrit-params.vue';
import GerritDropdown from './components/gerrit-dropdown.vue';

const image = new URL(
  '@/assets/images/integrations/gerrit.png',
  import.meta.url,
).href;

const gerrit: IntegrationConfig = {
  key: 'gerrit',
  name: 'Gerrit',
  image,
  description:
    'Connect Gerrit to sync documentation activities from your repos.',
  connectComponent: GerritConnect,
  connectedParamsComponent: GerritParams,
  dropdownComponent: GerritDropdown,
  showProgress: false,
};

export default gerrit;
