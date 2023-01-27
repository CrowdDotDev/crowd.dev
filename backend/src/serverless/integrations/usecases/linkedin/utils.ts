import { LinkedInAuthorType } from '../../types/linkedinTypes'

export const isLinkedInOrganization = (urn: string): boolean =>
  urn.startsWith('urn:li:organization:') || urn.startsWith('urn:li:company:')

export const isLinkedInUser = (urn: string): boolean => urn.startsWith('urn:li:person:')

export const getLinkedInMemberType = (urn: string): LinkedInAuthorType => {
  if (isLinkedInOrganization(urn)) {
    return LinkedInAuthorType.ORGANIZATION
  }
  if (isLinkedInUser(urn)) {
    return LinkedInAuthorType.USER
  }
  throw new Error(`Unknown LinkedIn member type: ${urn}`)
}

export const getLinkedInUserId = (urn: string): string => urn.replace('urn:li:person:', '')

export const getLinkedInOrganizationId = (urn: string): string =>
  urn.replace('urn:li:organization:', '').replace('urn:li:company:', '')
