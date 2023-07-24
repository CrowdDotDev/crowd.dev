export const serializeArray = (array: string[]): string => {
  return array.toString()
}

export const deserializeArray = (string: string): string[] => {
  return string.split(',')
}
