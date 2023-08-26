cube(`Conversations`, {
  sql: `SELECT 
    con.*, 
    a.platform AS platform, 
    a.channel AS category 
  FROM 
    conversations con 
    LEFT JOIN activities a ON con.id = a."conversationId" 
  GROUP BY 
    con.id, 
    a.platform,
    a.channel`,

  joins: {
    Activities: {
      sql: `${CUBE}.id = ${Activities}."conversationId"`,
      relationship: `hasMany`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [tenantId, createdat],
    },
  },

  dimensions: {
    id: {
      sql: `${CUBE}.id`,
      type: `string`,
      primaryKey: true,
    },

    tenantId: {
      sql: `${CUBE}."tenantId"`,
      type: `string`,
      shown: false,
    },

    published: {
      sql: `${CUBE}.published`,
      type: `string`,
    },

    createdat: {
      sql: `${CUBE}."createdAt"`,
      type: `time`,
    },

    platform: {
      sql: `${CUBE}."platform"`,
      type: `string`,
    },

    category: {
      sql: `${CUBE}."category"`,
      type: `string`,
    },
  },
})
