import { isEmail } from './validations'

export function getProperDisplayName(name: string): string {
  if (isEmail(name) || name.includes('@')) {
    return name.split('@')[0]
  }

  return name
}
