import { formatDate } from '@/utils/date'
import OrganizationEmployeesField from '@/modules/organization/organization-employees-field'

export const INITIAL_PAGE_SIZE = 20

export const INITIAL_VIEW_NEW_AND_ACTIVE_FILTER = {
  operator: 'and',
  attributes: {
    joinedAt: {
      name: 'joinedAt',
      label: 'Joined date',
      custom: false,
      props: {},
      defaultValue: formatDate({
        subtractDays: 30
      }),
      value: formatDate({
        subtractDays: 30
      }),
      defaultOperator: 'eq',
      operator: 'eq',
      type: 'date',
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
