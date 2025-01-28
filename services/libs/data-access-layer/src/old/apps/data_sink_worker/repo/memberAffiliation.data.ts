interface BaseData {
  memberId: string
  organizationId: string
  dateStart: string
  dateEnd: string
  title: string
  isPrimaryWorkExperience?: boolean
  memberCount?: number
}

export interface IManualAffiliationData extends BaseData {
  id: string
  segmentId: string
}

export interface IWorkExperienceData extends BaseData {
  id: string
}

export interface IOrganizationMemberCount {
  organizationId: string
  memberCount: number
}
