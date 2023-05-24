export const getCleanString = (value: string): string => {
  return value
    .replace(/[^-0-9A-Z ]+/gi, '') // only get alphanumeric characters and dashes
    .replace(/-+/gi, ' ') // convert dashes into spaces
    .replace(/\s+/g, ' ') // get rid of excessive spaces between words
    .toLowerCase()
    .trim()
}
