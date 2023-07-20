import { webhook } from './webhook';
import { slack } from './slack';
import { hubspot } from './hubspot';

interface AutomationTypeAction {
  label: string;
  action: () => void;
}

export interface AutomationTypeConfig {
  name: string;
  description: string;
  icon: string;
  canCreate: (store: any) => boolean;
  actionButton?: (store: any) => AutomationTypeAction | null;
  disabled?: (store: any) => boolean;
  emptyScreen?: {
    title: string;
    body: string;
  }
}

export const automationTypes: Record<string, AutomationTypeConfig> = {
  hubspot,
  slack,
  webhook,
};
