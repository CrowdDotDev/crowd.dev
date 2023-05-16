import { IMemberAttribute } from '@crowd/types'

export const pickAttributes = (
  names: string[],
  attributes: IMemberAttribute[],
): IMemberAttribute[] => {
  return attributes.filter((attribute) => names.includes(attribute.name))
}
