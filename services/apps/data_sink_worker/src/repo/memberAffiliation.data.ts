interface BaseData {
  memberId: string
  organizationId: string
  dateStart: string
  dateEnd: string
}

export interface IManualAffiliationData extends BaseData {
  id: string
  segmentId: string
}

export interface IWorkExperienceData extends BaseData {
  id: string
}
