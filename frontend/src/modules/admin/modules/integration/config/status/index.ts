import done from './done';
import error from './error';
import waitingForAction from './waiting-for-action';
import waitingApproval from './waiting-approval';
import connecting from './connecting';

export interface IntegrationStatusConfig {
  key: string;
  show: (integration: any) => boolean;
  status: {
    text: string;
    icon: string;
    color: string;
  },
  actionBar: {
    background: string;
    color: string;
  },
  tabs: {
    text: string;
    empty: string;
    badge: string;
  },
}

export const lfIntegrationStatuses: Record<string, IntegrationStatusConfig> = {
  done,
  error,
  waitingForAction,
  waitingApproval,
  connecting,
};

export const lfIntegrationStatusesTabs: Record<string, IntegrationStatusConfig> = {
  done,
  connecting,
  waitingForAction,
  error,
};

export const getIntegrationStatus = (integration: any): IntegrationStatusConfig => {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in lfIntegrationStatuses) {
    if (lfIntegrationStatuses[key].show(integration)) {
      return lfIntegrationStatuses[key];
    }
  }
  return connecting;
};
