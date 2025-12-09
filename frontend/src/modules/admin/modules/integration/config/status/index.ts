import done from './done'
import error from './error'
import waitingForAction from './waiting-for-action'
import connecting from './connecting'
import notConnected from './not-connected'

export interface IntegrationStatusConfig {
  key: string
  show: (integration: any) => boolean
  statuses: string[]
  status: {
    text: string
    icon: string
    iconType?: string
    color: string
  }
  actionBar: {
    background: string
    color: string
  }
  tabs: {
    text: string
    empty: string
    badge: string
  }
  chipStatus?: {
    icon: string
    iconType?: string
    color: string
  }
}

export const lfIntegrationStatuses: Record<string, IntegrationStatusConfig> = {
  done,
  error,
  waitingForAction,
  connecting,
}

export const lfIntegrationStatusesTabs: Record<string, IntegrationStatusConfig> = {
  done,
  connecting,
  waitingForAction,
  error,
  notConnected,
}

export const getIntegrationStatus = (integration: any): IntegrationStatusConfig => {
  // eslint-disable-next-line no-restricted-syntax
  for (const key in lfIntegrationStatuses) {
    if (lfIntegrationStatuses[key].show(integration)) {
      return lfIntegrationStatuses[key]
    }
  }
  return connecting
}
