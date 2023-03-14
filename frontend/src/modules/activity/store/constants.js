import { formatDate } from '@/utils/date'

export const INITIAL_PAGE_SIZE = 20

export const DEFAULT_ACTIVITY_FILTERS = [
  {
    member: {
      isTeamMember: {
        not: true
      },
      isBot: {
        not: true
      }
    }
  }
]

export const TRENDING_CONVERSATIONS_FILTER = {
  operator: 'and',
  attributes: {
    lastActive: {
      name: 'lastActive',
      label: 'Last activity',
      custom: false,
      props: {},
      defaultValue: formatDate({
        subtractDays: 7
      }),
      value: formatDate({
        subtractDays: 7
      }),
      defaultOperator: 'gt',
      operator: 'gt',
      type: 'date',
      expanded: false
    }
  }
}
