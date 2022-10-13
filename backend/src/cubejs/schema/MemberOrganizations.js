cube(`MemberOrganizations`, {
  sql: `SELECT * FROM public."memberOrganizations"`,
  
  preAggregations: {
    // Pre-Aggregations definitions go here
    // Learn more here: https://cube.dev/docs/caching/pre-aggregations/getting-started  
  },
  
  joins: {
     Organizations: {
       sql: `${CUBE}."organizationId" = ${Organizations}.id`,
       relationship: `belongsTo`
     },

    Activities: {
      sql: `${CUBE}."memberId" = ${Activities}."memberId"`,
      relationship: `hasMany`,
    },
  },
  
  measures: {
    count: {
      type: `count`,
      drillMembers: [organizationid, memberid, createdat, updatedat]
    }
  },
  
  dimensions: {
    id: {
      sql: `${CUBE}."memberId" || '-' || ${CUBE}."organizationid"`,
      type: `string`,
      primaryKey: true,

    },

    organizationid: {
      sql: `${CUBE}."organizationId"`,
      type: `string`
    },
    
    memberid: {
      sql: `${CUBE}."memberId"`,
      type: `string`
    },
    
    createdat: {
      sql: `${CUBE}."createdAt"`,
      type: `time`
    },
    
    updatedat: {
      sql: `${CUBE}."updatedAt"`,
      type: `time`
    }
  }
})
