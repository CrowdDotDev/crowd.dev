export interface IDbActivitySyncData {
  id: string
  tenantId: string
  segmentId: string
  type: string
  timestamp: string
  platform: string
  isContribution: boolean
  score: number | null
  sourceId: string
  sourceParentId: string | null
  attributes: unknown
}
