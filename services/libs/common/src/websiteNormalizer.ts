import { parse, isValid } from 'psl'

export const websiteNormalizer = (website: string): string => {
  // remove http:// or https:// and trailing slash
  const cleanURL = website.replace(/^(?:https?:\/\/)?([^/]+)(?:\/.*)?$/, '$1')
  const parsed = parse(cleanURL)

  if (!isValid(cleanURL)) {
    throw new Error('Invalid website URL!')
  }

  return parsed.domain
}
