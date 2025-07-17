import type { IMemberOrganization } from '@crowd/types'

export type MemberOrganizationWithOverrides = IMemberOrganization & {
  isPrimaryWorkExperience: boolean
  memberCount: number
}

export type TimelineItem = {
  dateStart: string
  dateEnd: string | null
  organizationId: string | null
  segmentId?: string
}

export interface MemberOrganizationAffiliationTimeline {
  earliestStartDate: string
  affiliations: TimelineItem[]
  fallbackOrganizationId: string | null
}
