cube(`Members`, {
  sql_table: 'mv_members_cube',

  joins: {
    Activities: {
      sql: `${CUBE}.id = ${Activities}."memberId"`,
      relationship: `hasMany`,
    },

    MemberTags: {
      sql: `${CUBE}.id = ${MemberTags}."memberId"`,
      relationship: `belongsTo`,
    },

    MemberOrganizations: {
      sql: `${CUBE}.id = ${MemberOrganizations}."memberId"`,
      relationship: `belongsTo`,
    },

    MemberSegments: {
      sql: `${CUBE}.id = ${MemberSegments}."memberId"`,
      relationship: `belongsTo`,
    },
  },

  measures: {
    count: {
      sql: `${CUBE}.id`,
      type: 'count_distinct',
    },

    cumulativeCount: {
      type: `count`,
      rollingWindow: {
        trailing: `unbounded`,
      },
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
      shown: false,
    },

    location: {
      sql: `${CUBE}.location`,
      type: `string`,
    },

    isTeamMember: {
      sql: `${CUBE}."isTeamMember"`,
      type: `boolean`,
    },
    isBot: {
      sql: `${CUBE}."isBot"`,
      type: `boolean`,
    },
    isOrganization: {
      sql: `${CUBE}."isOrganization"`,
      type: `boolean`,
    },

    joinedAt: {
      sql: `${CUBE}."joinedAt"`,
      type: `time`,
    },

    joinedAtUnixTs: {
      sql: `${CUBE}."joinedAtUnixTs"`,
      type: `number`,
    },

    score: {
      sql: `${CUBE}."score"`,
      type: `number`,
    },
  },
})
