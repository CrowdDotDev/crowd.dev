export enum IDataQualityType {
  TOO_MANY_IDENTITIES = 'too-many-identities',
  TOO_MANY_IDENTITIES_PER_PLATFORM = 'too-many-identities-per-platform',
  TOO_MANY_EMAILS = 'too-many-emails',
  NO_WORK_EXPERIENCE = 'no-work-experience',
  INCOMPLETE_WORK_EXPERIENCE = 'incomplete-work-experience',
  CONFLICTING_WORK_EXPERIENCE = 'conflicting-work-experience',
}

export interface IDataQualityParams {
  type: IDataQualityType
  limit?: number
  offset?: number
}
