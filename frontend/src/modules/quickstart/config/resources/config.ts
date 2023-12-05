import { QuickstartWidget } from '@/modules/quickstart/config/widgets';
import QuickstartResourcesWidget from '@/modules/quickstart/config/resources/quickstart-resources-widget.vue';

const resources: QuickstartWidget = {
  id: 'resources',
  display: () => true,
  component: QuickstartResourcesWidget,
};

export default resources;
