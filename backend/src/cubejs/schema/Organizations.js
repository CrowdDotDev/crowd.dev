/* eslint-disable no-restricted-globals */
cube(`Organizations`, {
  sql_table: 'organizations',
  preAggregations: {
    newOrganizations: {
      measures: [Organizations.count],
      dimensions: [
        Organizations.tenantId,
        Members.isTeamMember,
        Members.isBot,
        Segments.id,
        Activities.platform,
      ],
      timeDimension: Organizations.joinedAt,
      granularity: `day`,
    },
    activeOrganizations: {
      measures: [Organizations.count],
      dimensions: [
        Organizations.tenantId,
        Members.isTeamMember,
        Members.isBot,
        Segments.id,
        Activities.platform,
      ],
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
      drillMembers: [tenantId],
    },
  },
  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },

    tenantId: {
      sql: `${CUBE}."tenantId"`,
      type: `string`,
    },
    createdat: {
      sql: `${CUBE}."createdAt"`,
      type: `time`,
    },
    joinedAt: {
      sql: `${Members.earliestJoinedAt}`,
      type: `time`,
      subQuery: true,
    },
  },
})
