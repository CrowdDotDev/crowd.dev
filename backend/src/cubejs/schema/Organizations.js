/* eslint-disable no-restricted-globals */
cube(`Organizations`, {
  sql: `SELECT *
        FROM public.organizations`,
  preAggregations: {
    newOrganizations: {
      measures: [Organizations.count],
      dimensions: [Organizations.tenantId, Members.isTeamMember, Members.isBot, Segments.id],
      timeDimension: Organizations.joinedAt,
      granularity: `day`,
    },
    activeOrganizations: {
      measures: [Organizations.count],
      dimensions: [Organizations.tenantId, Members.isTeamMember, Members.isBot, Segments.id],
      timeDimension: Activities.date,
      granularity: `day`,
    },
  },
  joins: {
    MemberOrganizations: {
      sql: `${CUBE}.id = ${MemberOrganizations}."organizationId"`,
      relationship: `hasMany`,
    },
    OrganizationSegments: {
      sql: `${CUBE}.id = ${OrganizationSegments}."organizationId"`,
      relationship: `belongsTo`,
    },
  },
  measures: {
    count: {
      type: `count`,
      drillMembers: [updatedbyid, id, name, createdbyid, tenantId, createdat, updatedat],
    },
  },
  dimensions: {
    emails: {
      sql: `emails`,
      type: `string`,
    },
    logo: {
      sql: `logo`,
      type: `string`,
    },
    phonenumbers: {
      sql: `${CUBE}."phoneNumbers"`,
      type: `string`,
    },
    twitter: {
      sql: `twitter`,
      type: `string`,
    },
    importhash: {
      sql: `${CUBE}."importHash"`,
      type: `string`,
    },
    updatedbyid: {
      sql: `${CUBE}."updatedById"`,
      type: `string`,
    },
    revenuerange: {
      sql: `${CUBE}."revenueRange"`,
      type: `string`,
    },
    url: {
      sql: `url`,
      type: `string`,
    },
    tags: {
      sql: `tags`,
      type: `string`,
    },
    description: {
      sql: `description`,
      type: `string`,
    },
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },
    linkedin: {
      sql: `linkedin`,
      type: `string`,
    },
    name: {
      sql: `name`,
      type: `string`,
    },
    crunchbase: {
      sql: `crunchbase`,
      type: `string`,
    },
    createdbyid: {
      sql: `${CUBE}."createdById"`,
      type: `string`,
    },
    tenantId: {
      sql: `${CUBE}."tenantId"`,
      type: `string`,
    },
    parenturl: {
      sql: `${CUBE}."parentUrl"`,
      type: `string`,
    },
    createdat: {
      sql: `${CUBE}."createdAt"`,
      type: `time`,
    },
    updatedat: {
      sql: `${CUBE}."updatedAt"`,
      type: `time`,
    },
    deletedat: {
      sql: `${CUBE}."deletedAt"`,
      type: `time`,
    },
    joinedAt: {
      sql: `${Members.earliestJoinedAt}`,
      type: `time`,
      subQuery: true,
    },
  },
})
