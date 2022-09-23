export enum MemberAttributeName {
  ORGANISATION = 'organisation',
  SOURCE_ID = 'sourceId',
  IS_HIREABLE = 'isHireable',
  URL = 'url',
  NAME = 'name',
  IMAGE_URL = 'imageUrl',
  LOCATION = 'location',
  BIO = 'bio',
  COMPANY = 'company',
  WEBSITE_URL = 'websiteUrl',
  SAMPLE = 'sample',
  JOB_TITLE = 'jobTitle',
}

export const MemberAttributes = {
  [MemberAttributeName.ORGANISATION]: {
    name: MemberAttributeName.ORGANISATION,
    label: 'Organisation',
  },
  [MemberAttributeName.SOURCE_ID]: {
    name: MemberAttributeName.SOURCE_ID,
    label: 'Source Id',
  },
  [MemberAttributeName.IS_HIREABLE]: {
    name: MemberAttributeName.IS_HIREABLE,
    label: 'is Hireable',
  },
  [MemberAttributeName.URL]: {
    name: MemberAttributeName.URL,
    label: 'Url',
  },
  [MemberAttributeName.NAME]: {
    name: MemberAttributeName.NAME,
    label: 'Name',
  },
  [MemberAttributeName.IMAGE_URL]: {
    name: MemberAttributeName.IMAGE_URL,
    label: 'Image url',
  },
  [MemberAttributeName.LOCATION]: {
    name: MemberAttributeName.LOCATION,
    label: 'Location',
  },
  [MemberAttributeName.BIO]: {
    name: MemberAttributeName.BIO,
    label: 'Bio',
  },
  [MemberAttributeName.COMPANY]: {
    name: MemberAttributeName.COMPANY,
    label: 'Company',
  },
  [MemberAttributeName.WEBSITE_URL]: {
    name: MemberAttributeName.WEBSITE_URL,
    label: 'Website',
  },
  [MemberAttributeName.SAMPLE]: {
    name: MemberAttributeName.SAMPLE,
    label: 'Sample',
  },
  [MemberAttributeName.JOB_TITLE]: {
    name: MemberAttributeName.JOB_TITLE,
    label: 'Job Title',
  },
}
