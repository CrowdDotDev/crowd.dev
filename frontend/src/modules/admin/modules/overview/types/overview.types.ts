// import { IntegrationConfig } from '@/config/integrations'
// import { IntegrationStatusConfig } from '../../integration/config/status'
export interface OverviewTrends {
  current: number
  previous: number
  period: string
}

export interface IntegrationTabs {
  label: string
  key: string
  count: number
  icon: string
}

// TODO: Check with backend team about the data structure
export interface IntegrationStatus {
  grandparentId: string
  grandparentName: string
  id: string
  name: string
  parentId: string
  parentName: string
  platform: string
  segmentId: string
  settings: any
  status: string
  statusDetails: string
}

export interface GlobalIntegrationStatusCount {
  status: string
  count: number
}
