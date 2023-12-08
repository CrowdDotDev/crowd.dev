import lodash from 'lodash'

/**
 * Deep diff between two object, using lodash
 * @param  {Object} newObject  Object obtained after loadash merge
 * @param  {Object} original   Original object
 * @return {Object}            Object with the fields from newObject that are different from original
 */
function difference(newObject, original) {
  const lodash = require('lodash')
  const differentFields = Object.keys(newObject)
    .map((field) =>
      lodash.isEqual(newObject[field], original[field]) || newObject[field] === null ? null : field,
    )
    .filter((field) => field !== null)
  return lodash.pick(newObject, differentFields)
}

/**
 * Customising the merge.
 * - If the field is an array, concatenate the arrays
 * - If the newField is null, keep the original field
 * - Else, return undefined, and lodash will do standard merge
 * @param originalField Original field
 * @param newField New field
 * @returns Customisations for the merge.
 */
function customizer(originalField, newField) {
  if (lodash.isArray(originalField)) {
    return lodash.unionWith(originalField, newField, lodash.isEqual)
  }
  if (newField == null || (originalField != null && originalField !== '')) {
    return originalField
  }

  return undefined
}

/**
 * Given two object, perform a deepmerge. Then check if the deepMerged object
 * has any fields that are not in the original object.
 * Return an object with the merged fields that are different from the original object
 * @param {Object} originalObject
 * @param {Object} newObject
 * @param {Object} special: Fields that need special merging {field: (oldValue, newValue) => newValue}
 *  - To keep the earliest joinedAt:
 *      {joinedAt: (oldDate, newDate) => new Date(Math.min(newDate, oldDate))}
 *  - To always keep the original displayName:
 *      {displayName: (oldUsername, newUsername) => oldUsername}
 * @returns {Object} fields of the mergedObejct that are different from originalObject
 */
function merge(originalObject, newObject, special = {}) {
  const originalCopy = lodash.cloneDeep(originalObject)
  const merged = lodash.mergeWith({}, originalObject, newObject, customizer)

  for (const key in special) {
    if (Object.prototype.hasOwnProperty.call(special, key)) {
      lodash.set(
        merged,
        key,
        special[key](lodash.get(originalObject, key), lodash.get(merged, key)),
      )
    }
  }

  return difference(merged, originalCopy)
}

export default merge
