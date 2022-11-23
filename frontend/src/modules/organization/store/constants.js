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
    activeSince: {
      name: 'activeSince',
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
