import moment from 'moment'

export const INITIAL_PAGE_SIZE = 20

export const INITIAL_VIEW_ACTIVE_FILTER = {
  operator: 'and',
  attributes: {
    score: {
      name: 'score',
      label: 'Engagement Level',
      custom: false,
      props: {
        options: [
          {
            value: [0, 1],
            label: 'Silent'
          },
          {
            value: [2, 3],
            label: 'Quiet'
          },
          {
            value: [4, 6],
            label: 'Engaged'
          },
          {
            value: [7, 8],
            label: 'Fan'
          },
          {
            value: [9, 10],
            label: 'Ultra'
          }
        ],
        multiple: true
      },
      defaultValue: [
        {
          value: [7, 8],
          label: 'Fan',
          selected: false
        },
        {
          value: [9, 10],
          label: 'Ultra',
          selected: false
        }
      ],
      value: [
        {
          value: [7, 8],
          label: 'Fan',
          selected: false
        },
        {
          value: [9, 10],
          label: 'Ultra',
          selected: false
        }
      ],
      defaultOperator: null,
      operator: null,
      type: 'select',
      expanded: false
    }
  }
}
export const INITIAL_VIEW_RECENT_FILTER = {
  operator: 'and',
  attributes: {
    joinedAt: {
      name: 'joinedAt',
      label: 'Joined date',
      custom: false,
      props: {},
      defaultValue: moment()
        .subtract(30, 'days')
        .format('YYYY-MM-DD'),
      value: moment()
        .subtract(30, 'days')
        .format('YYYY-MM-DD'),
      defaultOperator: 'gt',
      operator: 'gt',
      type: 'date',
      expanded: false
    }
  }
}
