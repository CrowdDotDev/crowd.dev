import resources from './resources/config';
import support from './support/config';

export interface QuickstartWidget {
  id: string;
  display: (data: { user: any, tenant: any }) => boolean;
  component: any;
}

export const quickstartWidgets: QuickstartWidget[] = [
  support,
  resources,
];
