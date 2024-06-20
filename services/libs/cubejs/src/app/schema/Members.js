cube('Members', {
  sql_table: 'mv_members_cube',

  joins: {
    Activities: {
      sql: `${CUBE}.id = ${Activities}."memberId"`,
      relationship: 'hasMany',
    },

    MemberTags: {
      sql: `${CUBE}.id = ${MemberTags}."memberId"`,
      relationship: 'belongsTo',
    },

    MemberOrganizations: {
      sql: `${CUBE}.id = ${MemberOrganizations}."memberId"`,
      relationship: 'belongsTo',
    },

    MemberSegments: {
      sql: `${CUBE}.id = ${MemberSegments}."memberId"`,
      relationship: 'belongsTo',
    },

    MemberIdentities: {
      sql: `${CUBE}.id = ${MemberIdentities}."memberId"`,
      relationship: 'hasMany',
    },
  },

  measures: {
    count: {
      sql: `${CUBE}.id`,
      type: 'count_distinct',
    },

    cumulativeCount: {
      type: 'count',
      rollingWindow: {
        trailing: 'unbounded',
      },
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
      shown: false,
    },

    location: {
      sql: `${CUBE}.location`,
      type: 'string',
    },

    isTeamMember: {
      sql: `${CUBE}."isTeamMember"`,
      type: 'boolean',
    },
    isBot: {
      sql: `${CUBE}."isBot"`,
      type: 'boolean',
    },
    isOrganization: {
      sql: `${CUBE}."isOrganization"`,
      type: 'boolean',
    },

    joinedAt: {
      sql: `${CUBE}."joinedAt"`,
      type: 'time',
    },

    joinedAtUnixTs: {
      sql: `${CUBE}."joinedAtUnixTs"`,
      type: 'number',
    },

    score: {
      sql: `${CUBE}."score"`,
      type: 'number',
    },

    engagementLevel: {
      type: 'string',
      case: {
        when: [
          { sql: `${CUBE}.score = 0 or ${CUBE}.score = 1`, label: `Silent` },
          { sql: `${CUBE}.score = 2 or ${CUBE}.score = 3`, label: `Quiet` },
          { sql: `${CUBE}.score = 4 or ${CUBE}.score = 5 or ${CUBE}.score = 6`, label: `Engaged` },
          { sql: `${CUBE}.score = 7 or ${CUBE}.score = 8`, label: `Fan` },
          { sql: `${CUBE}.score = 9 or ${CUBE}.score = 10`, label: `Ultra` },
        ],
        else: { label: `Unknown` },
      },
    },
  },
})
