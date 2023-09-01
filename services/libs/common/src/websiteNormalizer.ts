import { parse, isValid } from 'psl'

export const websiteNormalizer = (website: string): string => {
  // remove http:// or https://
  const cleanURL = website.replace(/(^\w+:|^)\/\//, '')
  const parsed = parse(cleanURL)

  // If not valid website, return null
  if (!isValid(cleanURL)) {
    return null
  }

  return parsed.domain
}
