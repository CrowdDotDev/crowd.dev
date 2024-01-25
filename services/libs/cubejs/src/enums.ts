export enum CubeDimension {
  MEMBER_JOINED_AT = 'Members.joinedAt',
  MEMBER_JOINED_AT_DAY = 'Members.joinedAt.day',
  IS_TEAM_MEMBER = 'Members.isTeamMember',
  IS_BOT = 'Members.isBot',
  IS_ORGANIZATION = 'Members.isOrganization',
  ACTIVITY_DATE = 'Activities.date',
  ACTIVITY_DATE_DAY = 'Activities.date.day',
  ACTIVITY_PLATFORM = 'Activities.platform',
  MEMBER_IDENTITIES_PLATFORM = 'MemberIdentities.platform',
  ACTIVITY_TYPE = 'Activities.type',
  ACTIVITY_SENTIMENT_MOOD = 'Activities.sentimentMood',
  CONVERSATION_CREATED_AT = 'Conversations.createdat',
  CONVERSATION_FIRST_ACTIVITY_TIME = 'Conversations.firstActivityTime',
  ORGANIZATIONS_JOINED_AT = 'Organizations.joinedAt',
  ORGANIZATIONS_JOINED_AT_DAY = 'Organizations.joinedAt.day',
  ORGANIZATION_IDENTITIES_PLATFORM = 'OrganizationIdentities.platform',
  SEGMENTS_ID = 'Segments.id',
}

export enum CubeMeasure {
  MEMBER_COUNT = 'Members.count',
  ACTIVITY_COUNT = 'Activities.count',
  CONVERSATION_COUNT = 'Conversations.count',
  ORGANIZATION_COUNT = 'Organizations.count',
}

export enum CubeGranularity {
  SECOND = 'second',
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
}

export enum CubeOrderDirection {
  ASC = 'asc',
  DESC = 'desc',
}
