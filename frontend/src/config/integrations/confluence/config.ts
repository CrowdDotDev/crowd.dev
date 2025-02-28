import { IntegrationConfig } from '@/config/integrations';
import { getImageUrlFromPath } from '@/utils/image-loader';
import ConfluenceConnect from './components/confluence-connect.vue';
import ConfluenceParams from './components/confluence-params.vue';
import ConfluenceDropdown from './components/confluence-dropdown.vue';

const confluence: IntegrationConfig = {
  key: 'confluence',
  name: 'Confluence',
  image: getImageUrlFromPath('integrations/confluence.svg'),
  description:
    'Connect Confluence to sync documentation activities from your repos.',
  connectComponent: ConfluenceConnect,
  connectedParamsComponent: ConfluenceParams,
  dropdownComponent: ConfluenceDropdown,
  showProgress: false,
};

export default confluence;
