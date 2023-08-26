cube(`MemberTags`, {
  sql_table: '"memberTags"',

  joins: {
    Tags: {
      relationship: `hasMany`,
      sql: `${CUBE}."tagId" = ${Tags}."id"`,
    },
  },

  measures: {},

  dimensions: {},
})
