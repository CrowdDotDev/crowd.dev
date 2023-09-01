export const websiteNormalizer = (website: string): string => {
  // Prepends https:// to make valid URL
  const completeUrl = website.includes('://') ? website : 'https://' + website

  const url = new URL(completeUrl)
  const hostname = url.hostname

  const parts = hostname.split('.')
  // Ignore subdomains, return only domain and TLD
  if (parts.length > 2) {
    return parts.slice(-2).join('.')
  }

  return hostname
}
