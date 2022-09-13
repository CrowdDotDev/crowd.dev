import * as yup from 'yup'
import _values from 'lodash/values'

export class FilterSchema {
  constructor(fields) {
    this.fields = fields
  }

  initialValues(rawFilter = {}, queryParams = {}) {
    queryParams = queryParams || {}
    let record = rawFilter || {}

    const hasFilterFromQuery = _values(queryParams).some(
      (filterValue) => Boolean(filterValue)
    )

    if (hasFilterFromQuery) {
      record = queryParams
    }

    return record
  }

  rules() {
    const rules = {}

    this.fields.forEach((field) => {
      rules[field.name] = field.forFilterRules()
    })

    return rules
  }

  castSchema() {
    const shape = {}

    this.fields.forEach((field) => {
      shape[field.name] = field.forFilterCast()
    })

    return yup.object().shape(shape)
  }

  cast(values) {
    return this.castSchema().cast(values)
  }
}
