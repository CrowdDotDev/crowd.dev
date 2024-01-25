cube('Sentiment', {
  sql: `select
      a.id,
      a."tenantId" ,
      a."platform" ,
      a."timestamp" ,
      a."memberId" ,
      (a.sentiment->>'sentiment')::integer as sentiment,
      case
          when (a.sentiment->>'sentiment')::integer < 34 then 'negative'
          when (a.sentiment->>'sentiment')::integer > 66 then 'positive'
          else 'neutral'
      end as mood
    from
      activities a
    where
      a.sentiment->>'sentiment' is not null`,

  preAggregations: {},

  joins: {
    Members: {
      sql: `${CUBE}."memberId" = ${Members}."id"`,
      relationship: 'belongsTo',
    },
  },

  measures: {
    averageSentiment: {
      type: 'avg',
      sql: 'sentiment',
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

    platform: {
      sql: `${CUBE}.platform`,
      type: 'string',
    },

    date: {
      sql: `${CUBE}.timestamp`,
      type: 'time',
    },
  },
})
