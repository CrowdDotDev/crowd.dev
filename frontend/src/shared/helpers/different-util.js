import isEqual from 'lodash/isEqual';
import isEmpty from 'lodash/isEmpty';
import xorWith from 'lodash/xorWith';

const attributeIsDifferent = (attribute) => {
  if (attribute.operator !== attribute.defaultOperator) {
    return true;
  }

  return Array.isArray(attribute.value)
    ? !isEmpty(xorWith(attribute.value, attribute.defaultValue, isEqual))
    : attribute.value !== attribute.defaultValue;
};

const filtersAreDifferent = (filterObjA, filterObjB) => {
  if (
    Object.keys(filterObjA).length
    !== Object.keys(filterObjB).length
  ) {
    // Objects are not fully built yet, no need to compare
    return false;
  } if (
    Object.keys(filterObjA.attributes).length
    !== Object.keys(filterObjB.attributes).length
  ) {
    return true;
  } if (filterObjA.operator !== filterObjB.operator) {
    return true;
  }
  return Object.values(filterObjA.attributes).some(
    (attribute) => attributeIsDifferent(attribute),
  );
};

const attributesAreDifferent = (attributeA, attributeB) => {
  if (!attributeA || !attributeB) {
    return true;
  } if (attributeA.operator !== attributeB.operator
    || (attributeA.include !== attributeB.include
      && !attributeA.custom && !attributeB.custom)) {
    return true;
  } if (
    (Array.isArray(attributeA.value)
      && !Array.isArray(attributeB.value))
    || (!Array.isArray(attributeA.value)
      && Array.isArray(attributeB.value))
  ) {
    return true;
  }

  return Array.isArray(attributeA.value)
    ? !isEmpty(xorWith(attributeA.value, attributeB.value, isEqual))
    : attributeA.value !== attributeB.value;
};

export { filtersAreDifferent, attributesAreDifferent };
