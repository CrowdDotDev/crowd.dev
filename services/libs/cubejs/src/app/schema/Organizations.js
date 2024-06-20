cube('Organizations', {
  sql_table: 'mv_organizations_cube',
  joins: {
    MemberOrganizations: {
      sql: `${CUBE}.id = ${MemberOrganizations}."organizationId"`,
      relationship: 'hasMany',
    },
    Activities: {
      sql: `${CUBE}.id = ${Activities}."organizationId"`,
      relationship: 'hasMany',
    },
    OrganizationSegments: {
      sql: `${CUBE}.id = ${OrganizationSegments}."organizationId"`,
      relationship: 'belongsTo',
    },

    OrganizationIdentities: {
      sql: `${CUBE}.id = ${OrganizationIdentities}."organizationId"`,
      relationship: 'hasMany',
    },
  },
  measures: {
    count: {
      sql: `${CUBE}.id`,
      type: 'count_distinct',
      drillMembers: [tenantId],
    },
  },
  dimensions: {
    id: {
      sql: `${CUBE}.id`,
      type: 'string',
      primaryKey: true,
    },

    tenantId: {
      sql: `${CUBE}."tenantId"`,
      type: 'string',
    },
    createdat: {
      sql: `${CUBE}."createdAt"`,
      type: 'time',
    },
    joinedAt: {
      sql: `${CUBE}."earliestJoinedAt"`,
      type: 'time',
    },
  },
})
