import { formatDate } from '@/utils/date'
import OrganizationEmployeesField from '@/modules/organization/organization-employees-field'
import ActivityDateField from '@/shared/fields/activity-date-field'

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
      props: {
        options: new ActivityDateField().dropdownOptions(),
        multiple: false
      },
      defaultValue: formatDate({
        subtractDays: 30
      }),
      value: formatDate({
        subtractDays: 30
      }),
      defaultOperator: 'gte',
      operator: 'gte',
      type: 'select',
      expanded: false
    }
  }
}

export const INITIAL_VIEW_ENTERPRISE_SIZE_FILTER = {
  operator: 'and',
  attributes: {
    employees: {
      name: 'employees',
      label: '# of employees',
      custom: false,
      props: {
        options:
          new OrganizationEmployeesField().dropdownOptions(),
        multiple: false
      },
      defaultValue: [1001, 5000],
      value: [1001, 5000],
      defaultOperator: 'between',
      operator: 'between',
      type: 'select',
      expanded: false
    }
  }
}
