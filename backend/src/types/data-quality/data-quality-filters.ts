export enum IDataQualityType {
  TOO_MANY_IDENTITIES = 'too-many-identities',
  TOO_MANY_IDENTITIES_PER_PLATFORM = 'too-many-identities-per-platform',
  NO_WORK_EXPERIENCE = 'no-work-experience',
}

export interface IDataQualityParams {
  type: IDataQualityType
  limit?: number
  offset?: number
}
