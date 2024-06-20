import { parse } from 'tldts'

interface ParsedResult {
  hostname: string | null
  isIp: boolean | null
  subdomain: string | null
  domain: string | null
  publicSuffix: string | null
  domainWithoutSuffix: string | null
  isIcann: boolean | null
  isPrivate: boolean | null
}

const isValid = (parsed: ParsedResult) => {
  return Boolean(parsed.domain && parsed.isIcann)
}

export const websiteNormalizer = (website: string, throwError = true): string | undefined => {
  // remove http:// or https:// and trailing slash
  const cleanURL = website.replace(/^(?:https?:\/\/)?([^/]+)(?:\/.*)?$/, '$1')
  const parsed = parse(cleanURL)

  if (!isValid(parsed)) {
    if (throwError) {
      throw new Error(`Invalid website URL '${website}' - clean '${cleanURL}'!`)
    }
    return undefined
  }

  const domain = parsed.domain?.toLowerCase()
  const subdomain = parsed.subdomain ? `${parsed.subdomain.toLowerCase()}.` : ''

  const normalized = `${subdomain}${domain}`

  return normalized
}
