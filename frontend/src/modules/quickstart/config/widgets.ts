import resources from './resources/config';
import support from './support/config';
import upgradePlan from './upgradePlan/config';

export interface QuickstartWidget {
  id: string;
  display: () => boolean;
  component: any;
}

export const quickstartWidgets: QuickstartWidget[] = [
  upgradePlan,
  resources,
  support,
];
