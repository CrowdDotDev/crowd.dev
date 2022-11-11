/**
 * Generates a cleaned string from given string by:
 * Removing non alphanumeric characters from a string
 * Converting dashes into spaces
 * Removing extraneous whitespaces between words
 * @param string string to be cleaned
 * @returns cleaned string
 *
 */
export default (string: string): string =>
  string
    .replace(/[^-0-9A-Z ]+/gi, '') // only get alphanumeric characters and dashes
    .replace(/-+/gi, ' ') // convert dashes into spaces
    .replace(/\s+/g, ' ') // get rid of excessive spaces between words
    .toLowerCase()
    .trim()
