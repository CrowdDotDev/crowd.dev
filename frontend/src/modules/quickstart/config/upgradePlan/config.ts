import { QuickstartWidget } from '@/modules/quickstart/config/widgets';
import QuickstartUpgradePlanWidget from '@/modules/quickstart/config/upgradePlan/quickstart-upgrade-plan-widget.vue';
import config from '@/config';

const upgradePlan: QuickstartWidget = {
  id: 'upgradePlan',
  display: ({ tenant }) => tenant.plan === 'Essential' && !config.isCommunityVersion,
  component: QuickstartUpgradePlanWidget,
};

export default upgradePlan;
