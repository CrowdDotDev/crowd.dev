export function splitFullName(fullName) {
  let firstName
  let lastName

  if (fullName && fullName.split(' ').length > 1) {
    const [firstNameArray, ...lastNameArray] = fullName.split(' ')
    firstName = firstNameArray
    lastName = lastNameArray.join(' ')
  } else {
    firstName = fullName || null
    lastName = null
  }

  return { firstName, lastName }
}
