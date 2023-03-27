export default {
  date: {
    operator: {
      eq: 'is',
      lt: 'is before',
      gt: 'is after',
      between: 'between',
    },
  },
  number: {
    operator: {
      eq: 'is',
      lt: '<',
      lte: '<=',
      gt: '>',
      gte: '>=',
      between: 'between',
    },
  },
  string: {
    operator: {
      eq: 'is',
      ne: 'is not',
      textContains: 'contains',
      notContains: 'not contains',
    },
  },
};
