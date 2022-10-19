import _ from 'lodash'

const filterIsDifferent = (filterObjA, filterObjB) => {
  if (
    Object.keys(filterObjA).length !==
    Object.keys(filterObjB).length
  ) {
    // Objects are not fully built yet, no need to compare
    return false
  } else if (
    Object.keys(filterObjA.attributes).length !==
    Object.keys(filterObjB.attributes).length
  ) {
    return true
  } else if (filterObjA.operator !== filterObjB.operator) {
    return true
  } else {
    return Object.values(filterObjA.attributes).some(
      (attribute) => {
        return attributeIsDifferent(attribute)
      }
    )
  }
}

const attributeIsDifferent = (attribute) => {
  return attribute.operator !== attribute.defaultOperator ||
    Array.isArray(attribute.value)
    ? !_(attribute.value)
        .differenceWith(attribute.defaultValue, _.isEqual)
        .isEmpty()
    : attribute.value !== attribute.defaultValue
}

export { filterIsDifferent, attributeIsDifferent }
