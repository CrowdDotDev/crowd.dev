import type { IMemberOrganization } from '@crowd/types'

import type { IDbActivityCreateData } from '../old/apps/data_sink_worker/repo/activity.data'

interface OrganizationTimeline {
  startDate: string
  endDate: string
  organizationId: string
}

export interface MemberOrganizationTimeline {
  timelinePeriods: OrganizationTimeline[]
  fallbackOrganizationId: string | null
}

export type Condition = {
  when: string[]
  orgId: string
  matches: (activity: IDbActivityCreateData) => boolean
}

export type MemberOrganizationWithOverrides = IMemberOrganization & {
  isPrimaryWorkExperience: boolean
  memberCount: number
}

export type TimelineItem = {
  organizationId: string
  isPrimaryWorkExperience: boolean
  withDates?: boolean
}
