cube(`Organizations`, {
  sql_table: 'mv_organizations_cube',
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
      sql: `${CUBE}."earliestJoinedAt"`,
      type: `time`,
    },
  },
})
