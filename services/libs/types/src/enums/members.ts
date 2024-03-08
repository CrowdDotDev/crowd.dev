export enum MemberAttributeType {
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  EMAIL = 'email',
  STRING = 'string',
  URL = 'url',
  DATE = 'date',
  MULTI_SELECT = 'multiSelect',
  SPECIAL = 'special',
}

export enum MemberAttributeName {
  ORGANISATION = 'organisation',
  SOURCE_ID = 'sourceId',
  IS_HIREABLE = 'isHireable',
  URL = 'url',
  NAME = 'name',
  AVATAR_URL = 'avatarUrl',
  LOCATION = 'location',
  BIO = 'bio',
  COMPANY = 'company',
  WEBSITE_URL = 'websiteUrl',
  SAMPLE = 'sample',
  JOB_TITLE = 'jobTitle',
  IS_TEAM_MEMBER = 'isTeamMember',
  IS_ORGANIZATION = 'isOrganization',
  IS_BOT = 'isBot',
  TIMEZONE = 'timezone',
  KARMA = 'karma',
  SYNC_REMOTE = 'syncRemote',
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
  [MemberAttributeName.AVATAR_URL]: {
    name: MemberAttributeName.AVATAR_URL,
    label: 'Avatar url',
  },
  [MemberAttributeName.LOCATION]: {
    name: MemberAttributeName.LOCATION,
    label: 'Location',
  },
  [MemberAttributeName.BIO]: {
    name: MemberAttributeName.BIO,
    label: 'Bio',
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
  [MemberAttributeName.TIMEZONE]: {
    name: MemberAttributeName.TIMEZONE,
    label: 'Timezone',
  },
  [MemberAttributeName.IS_TEAM_MEMBER]: {
    name: MemberAttributeName.IS_TEAM_MEMBER,
    label: 'is Team Member',
  },
  [MemberAttributeName.IS_ORGANIZATION]: {
    name: MemberAttributeName.IS_ORGANIZATION,
    label: 'is Organization',
  },
  [MemberAttributeName.IS_BOT]: {
    name: MemberAttributeName.IS_BOT,
    label: 'is Bot',
  },
  [MemberAttributeName.KARMA]: {
    name: MemberAttributeName.KARMA,
    label: 'Karma',
  },
  [MemberAttributeName.SYNC_REMOTE]: {
    name: MemberAttributeName.SYNC_REMOTE,
    label: 'Sync remote',
  },
}

export enum MemberEnrichmentAttributeName {
  SENIORITY_LEVEL = 'seniorityLevel',
  EMAILS = 'emails',
  SKILLS = 'skills',
  COUNTRY = 'country',
  PROGRAMMING_LANGUAGES = 'programmingLanguages',
  LANGUAGES = 'languages',
  YEARS_OF_EXPERIENCE = 'yearsOfExperience',
  EDUCATION = 'education',
  AWARDS = 'awards',
  CERTIFICATIONS = 'certifications',
  WORK_EXPERIENCES = 'workExperiences',
  EXPERTISE = 'expertise',
}

export const MemberEnrichmentAttributes = {
  [MemberEnrichmentAttributeName.SENIORITY_LEVEL]: {
    name: MemberEnrichmentAttributeName.SENIORITY_LEVEL,
    label: 'Seniority Level',
  },
  [MemberEnrichmentAttributeName.EMAILS]: {
    name: MemberEnrichmentAttributeName.EMAILS,
    label: 'Emails',
  },
  [MemberEnrichmentAttributeName.SKILLS]: {
    name: MemberEnrichmentAttributeName.SKILLS,
    label: 'Skills',
  },
  [MemberEnrichmentAttributeName.COUNTRY]: {
    name: MemberEnrichmentAttributeName.COUNTRY,
    label: 'Country',
  },
  [MemberEnrichmentAttributeName.PROGRAMMING_LANGUAGES]: {
    name: MemberEnrichmentAttributeName.PROGRAMMING_LANGUAGES,
    label: 'Programming Languages',
  },
  [MemberEnrichmentAttributeName.LANGUAGES]: {
    name: MemberEnrichmentAttributeName.LANGUAGES,
    label: 'Languages',
  },
  [MemberEnrichmentAttributeName.YEARS_OF_EXPERIENCE]: {
    name: MemberEnrichmentAttributeName.YEARS_OF_EXPERIENCE,
    label: 'Years of Experience',
  },
  [MemberEnrichmentAttributeName.EDUCATION]: {
    name: MemberEnrichmentAttributeName.EDUCATION,
    label: 'Education',
  },
  [MemberEnrichmentAttributeName.AWARDS]: {
    name: MemberEnrichmentAttributeName.AWARDS,
    label: 'Awards',
  },
  [MemberEnrichmentAttributeName.CERTIFICATIONS]: {
    name: MemberEnrichmentAttributeName.CERTIFICATIONS,
    label: 'Certifications',
  },
  [MemberEnrichmentAttributeName.WORK_EXPERIENCES]: {
    name: MemberEnrichmentAttributeName.WORK_EXPERIENCES,
    label: 'Work Experiences',
  },
  [MemberEnrichmentAttributeName.EXPERTISE]: {
    name: MemberEnrichmentAttributeName.EXPERTISE,
    label: 'Expertise',
  },
}
