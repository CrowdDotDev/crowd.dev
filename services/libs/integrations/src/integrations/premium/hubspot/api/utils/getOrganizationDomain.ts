export const getOrganizationDomain = (website: string) => {
  return website.replace('https://', '').replace('http://', '').replace('www.', '').replace('/', '')
}
