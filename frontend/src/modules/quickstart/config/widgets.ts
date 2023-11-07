import resources from './resources/config';
import support from './support/config';
import upgradePlan from './upgradePlan/config';

export interface QuickstartWidget {
  id: string;
  display: (data: { user: any, tenant: any }) => boolean;
  component: any;
}

export const quickstartWidgets: QuickstartWidget[] = [
  upgradePlan,
  resources,
  support,
];
