export const getOrganizationDomain = (website: string) => {
  return website.replace('https://', '').replace('www.', '').replace('/', '')
}
