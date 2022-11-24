import { formatDate } from '@/utils/date'

export const INITIAL_PAGE_SIZE = 20

export const INITIAL_VIEW_NEW_AND_ACTIVE_FILTER = {
  operator: 'and',
  attributes: {
    activityCount: {
      name: 'activityCount',
      label: '# of activities',
      custom: false,
      props: {},
      defaultValue: 1000,
      value: 1000,
      defaultOperator: 'gt',
      operator: 'gt',
      type: 'number',
      expanded: false
    },
    joinedAt: {
      name: 'joinedAt',
      label: 'Active since',
      custom: false,
      props: {},
      defaultValue: formatDate({
        subtractDays: 30
      }),
      value: formatDate({
        subtractDays: 30
      }),
      defaultOperator: 'lt',
      operator: 'lt',
      type: 'date',
      expanded: false
    }
  }
}

export const INITIAL_VIEW_ENTERPRISE_SIZE_FILTER = {
  operator: 'and',
  attributes: {
    employeesRange: {
      name: 'activityCount',
      label: '# of activities',
      custom: false,
      props: {},
      defaultValue: [1001, 5000],
      value: [1001, 5000],
      defaultOperator: 'between',
      operator: 'between',
      type: 'number',
      expanded: false
    }
  }
}
