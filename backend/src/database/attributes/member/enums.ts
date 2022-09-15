export enum MemberAttributeName {
  ORGANISATION = 'organisation',
  ID = 'id',
  IS_HIREABLE = 'isHireable',
  URL = 'url',
  NAME = 'name',
  IMAGE_URL = 'imageUrl',
  LOCATION = 'location',
  BIO = 'bio',
  COMPANY = 'company',
  WEBSITE_URL = 'websiteUrl',
  SAMPLE = 'sample',
}

export const MemberAttributes = {
  [MemberAttributeName.ORGANISATION]: {
    name: MemberAttributeName.ORGANISATION,
    label: 'Organisation',
  },
  [MemberAttributeName.ID]: {
    name: MemberAttributeName.ID,
    label: 'Id',
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
}
