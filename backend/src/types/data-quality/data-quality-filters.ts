export enum IDataQualityType {
  MORE_THAN_10_IDENTITIES = 'more-than-10-identities',
  MORE_THAN_1_IDENTITY_PER_PLATFORM = 'more-than-1-identity-per-platform',
  NO_WORK_EXPERIENCE = 'no-work-experience',
}

export interface IDataQualityParams {
  type: IDataQualityType
  limit?: number
  offset?: number
}
