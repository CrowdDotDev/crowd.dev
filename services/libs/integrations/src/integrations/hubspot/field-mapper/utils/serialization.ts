export const serializeArray = (array: string[]): string => {
  if (!array || array.length === 0) {
    return undefined
  }
  return array.toString()
}

export const deserializeArray = (string: string): string[] => {
  return string.split(',')
}

export const serializeDate = (date: string): number => {
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime()) || dateObj.getTime() === 0) {
    return undefined
  }
  dateObj.setUTCHours(0, 0, 0, 0)
  return dateObj.getTime()
}
