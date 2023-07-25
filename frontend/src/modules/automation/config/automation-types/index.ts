import { webhook } from './webhook/config';
import { slack } from './slack/config';
import { hubspot } from './hubspot/config';

interface AutomationTypeAction {
  label: string; // Text of the action button
  action: () => void; // Action triggered on  button click
}
interface AutomationTypeEmptyScreen {
  title: string; // Title in empty screen
  body: string; // Body text in empty screen
}

export interface AutomationTypeConfig {
  name: string; // Name of the automation
  description: string; // Description shown under name in dropdown
  icon: string; // Icon of the automation type
  canCreate: (store: any) => boolean; // method if creation of that automation type is disabled
  actionButton?: (store: any) => AutomationTypeAction | null; // Action button to show in dropdown
  disabled?: (store: any) => boolean | string; // If dropdown option is disabled
  tooltip?: (store: any) => string | null; // Show tooltip
  emptyScreen?: AutomationTypeEmptyScreen, // Text for empty screen if there is no automations of that type
  triggerText: string; // Description shown below Trigger in automation form
  actionText: string; // Description shown below Action in automation form
  createButtonText?: string;
  actionComponent: any; // Component which handeles form for action
  triggerComponent: any; // Component which handeles form for trigger
  paywallComponent?: (store: any) => any | null;
  settingsMap?: (settings: any) => any;
}

export const automationTypes: Record<string, AutomationTypeConfig> = {
  hubspot,
  slack,
  webhook,
};
