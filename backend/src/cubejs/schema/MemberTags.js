cube(`MemberTags`, {
  sql_table: '"memberTags"',

  joins: {
    Tags: {
      relationship: `hasMany`,
      sql: `${CUBE}."tagId" = ${Tags}."id"`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [memberid, tagid, createdat, updatedat],
      shown: false,
    },
  },

  dimensions: {
    id: {
      sql: `CONCAT(${CUBE}.memberId, ${CUBE}.tagId)`,
      type: `string`,
      primaryKey: true,
    },
    memberid: {
      sql: `${CUBE}."memberId"`,
      type: `string`,
      shown: false,
    },

    tagid: {
      sql: `${CUBE}."tagId"`,
      type: `string`,
      shown: false,
    },

    createdat: {
      sql: `${CUBE}."createdAt"`,
      type: `time`,
      shown: false,
    },

    updatedat: {
      sql: `${CUBE}."updatedAt"`,
      type: `time`,
      shown: false,
    },
  },
})
