import { QuickstartWidget } from '@/modules/quickstart/config/widgets';
import QuickstartSupportWidget from '@/modules/quickstart/config/support/quickstart-support-widget.vue';

const support: QuickstartWidget = {
  id: 'support',
  display: () => true,
  component: QuickstartSupportWidget,
};

export default support;
