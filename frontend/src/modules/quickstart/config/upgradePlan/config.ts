import { QuickstartWidget } from '@/modules/quickstart/config/widgets';
import QuickstartUpgradePlanWidget from '@/modules/quickstart/config/upgradePlan/quickstart-upgrade-plan-widget.vue';

const upgradePlan: QuickstartWidget = {
  id: 'upgradePlan',
  display: () => true,
  component: QuickstartUpgradePlanWidget,
};

export default upgradePlan;
