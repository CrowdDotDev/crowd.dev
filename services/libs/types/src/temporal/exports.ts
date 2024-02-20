import { OpensearchQueryCriteria } from '../'

export interface ITriggerCSVExport {
  tenantId: string
  segmentIds: string[]
  criteria: OpensearchQueryCriteria
  sendTo: string[]
}
