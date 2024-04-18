import { IMemberAttribute } from '@crowd/types'

export const pickAttributes = (
  names: string[],
  attributes: IMemberAttribute[],
): IMemberAttribute[] => {
  return attributes.filter((attribute) => names.includes(attribute.name))
}

export const roundToNearestMinute = (eventTS: string): string => {
  const roundToMS: number = 1000 * 60 * 1
  const eventTSDate: Date = new Date(eventTS)

  return new Date(Math.round(eventTSDate.getTime() / roundToMS) * roundToMS).toISOString()
}
