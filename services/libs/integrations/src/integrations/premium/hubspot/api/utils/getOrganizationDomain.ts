export const getOrganizationDomain = (website: string): string => {
  try {
    return new URL(website).host
  } catch (e) {
    return null
  }
}
