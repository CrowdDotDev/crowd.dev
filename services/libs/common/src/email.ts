import validator from 'validator'

export const isValidEmail = (value: string): boolean => {
  return validator.isEmail(value)
}