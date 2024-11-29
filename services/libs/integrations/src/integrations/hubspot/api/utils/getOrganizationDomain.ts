export const getOrganizationDomain = (website: string): string => {
  try {
    if (website.startsWith('http')) {
      return new URL(website).host
    }
    return website
  } catch (e) {
    return null
  }
}
