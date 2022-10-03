import IntegerRangeField from '@/shared/fields/integer-range-field'

export default class MemberEngagementLevelField extends IntegerRangeField {
  dropdownOptions() {
    return [
      {
        value: '0-1',
        label: 'Silent'
      },
      {
        value: '2-3',
        label: 'Quiet'
      },
      {
        value: '4-6',
        label: 'Engaged'
      },
      {
        value: '7-8',
        label: 'Fan'
      },
      {
        value: '9-10',
        label: 'Ultra'
      }
    ]
  }
  getSelectedDropdownOption(value) {
    const start = value[0]
    const end = value.length === 2 && value[1]

    return this.dropdownOptions().find((o) => {
      const values = o.value.split('-')
      return values[0] === start && values[1] === end
    })
  }

  forFilterPreview(value) {
    if (!value || !value.length) {
      return null
    }

    return this.getSelectedDropdownOption(value).label
  }
}
