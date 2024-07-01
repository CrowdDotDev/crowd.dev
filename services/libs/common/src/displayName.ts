import { isEmail, isPartialEmail } from './validations'

/**
 * Get a proper display name from a given name string.
 *
 * If there are multiple name parts and one or multiple of them (but not all) look like email,
 * those parts are removed and the remaining parts are concatenated and returned.
 *
 * If there is one name part and it looks like an email, the part before '@' is returned.
 *
 * If there are multiple name parts and all of them look like emails, the first part before '@' is returned.
 *
 * @param {string} name - The input name string.
 * @returns {string} - The proper display name.
 *
 * @example
 * getProperDisplayName('John Doe') // returns 'John Doe'
 * getProperDisplayName('john.doe@example.com') // returns 'john.doe'
 * getProperDisplayName('John john.doe@example.com Doe') // returns 'John Doe'
 * getProperDisplayName('john.doe@example.com jane.doe@example.com') // returns 'john.doe'
 * getProperDisplayName('john@gmail.com') // returns 'john'
 * getProperDisplayName('john@gmail') // returns 'john'
 * getProperDisplayName('john@gmail.') // returns 'john'
 * getProperDisplayName('john@g') // returns 'john'
 * getProperDisplayName('@johndoe') // returns '@johndoe'
 * getProperDisplayName('johndoe@') // returns 'johndoe@'
 */
export function getProperDisplayName(name: string): string {
  const nameParts = name.trim().split(/\s+/)

  if (nameParts.length === 1 && !nameParts[0]) {
    throw new Error('Display name cannot be empty')
  }

  if (nameParts.length === 0) {
    throw new Error('Display name cannot be empty')
  }

  if (nameParts.length === 1) {
    if (isEmail(nameParts[0]) || isPartialEmail(nameParts[0])) {
      return nameParts[0].split('@')[0]
    }
    return nameParts[0]
  }

  // parts that are not emails
  const filteredNameParts = nameParts.filter((part) => !isEmail(part) && !isPartialEmail(part))

  if (filteredNameParts.length > 0) {
    return filteredNameParts.join(' ')
  }

  return nameParts[0].split('@')[0]
}
