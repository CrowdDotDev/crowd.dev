cube(`MemberTags`, {
  sql: `SELECT * FROM public."communityMemberTags"`,

  joins: {
    Tags: {
      relationship: `hasMany`,
      sql: `${CUBE}."tagId" = ${Tags}."id"`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [communitymemberid, tagid, createdat, updatedat],
      shown: false,
    },
  },

  dimensions: {
    id: {
      sql: `CONCAT(${CUBE}.communityMemberId, ${CUBE}.tagId)`,
      type: `string`,
      primaryKey: true,
    },
    communitymemberid: {
      sql: `${CUBE}."communityMemberId"`,
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
