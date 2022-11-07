import * as yup from 'yup'
import GenericField from '@/shared/fields/generic-field'
import { formatDate } from '@/utils/date'

export default class DateRangeField extends GenericField {
  forFilterInitialValue(value) {
    return value || []
  }

  forFilterCast() {
    return yup.mixed().transform((value, originalValue) => {
      if (!originalValue) {
        return originalValue
      }

      if (!originalValue.length) {
        return originalValue
      }

      return originalValue.map((value) => {
        return value
          ? formatDate({ timestamp: value })
          : null
      })
    })
  }

  forFilterPreview(value) {
    if (!value || !value.length) {
      return null
    }

    const start = value[0]
    const end = value.length === 2 && value[1]

    if (!start && !end) {
      return null
    }

    if (start && !end) {
      return `> ${formatDate(start)}`
    }

    if (!start && end) {
      return `< ${formatDate(end)}`
    }

    return `${formatDate(start)} - ${formatDate(end)}`

    function formatDate(value) {
      return value ? formatDate({ timestamp: value }) : null
    }
  }
}
