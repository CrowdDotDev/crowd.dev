import _ from 'lodash'

const filtersAreDifferent = (filterObjA, filterObjB) => {
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

const attributesAreDifferent = (attributeA, attributeB) => {
  if (!attributeA || !attributeB) {
    return true
  } else if (attributeA.operator !== attributeB.operator) {
    return true
  } else if (
    (Array.isArray(attributeA.value) &&
      !Array.isArray(attributeB.value)) ||
    (!Array.isArray(attributeA.value) &&
      Array.isArray(attributeB.value))
  ) {
    return true
  }

  return Array.isArray(attributeA.value)
    ? !_(attributeA.value)
        .xorWith(attributeB.value, _.isEqual)
        .isEmpty()
    : attributeA.value !== attributeB.value
}

const attributeIsDifferent = (attribute) => {
  if (attribute.operator !== attribute.defaultOperator) {
    return true
  }

  return Array.isArray(attribute.value)
    ? !_(attribute.value)
        .xorWith(attribute.defaultValue, _.isEqual)
        .isEmpty()
    : attribute.value !== attribute.defaultValue
}

export {
  filtersAreDifferent,
  attributesAreDifferent,
  attributeIsDifferent
}
