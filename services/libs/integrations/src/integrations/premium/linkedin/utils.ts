import { IMemberData, PlatformType } from '@crowd/types'
import { LinkedInAuthorType } from './api/types'
import { single } from '@crowd/common'

export const isLinkedInOrganization = (urn: string): boolean =>
  urn.startsWith('urn:li:organization:') ||
  urn.startsWith('urn:li:company:') ||
  urn.startsWith('urn:li:organizationBrand:')

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
  urn
    .replace('urn:li:organization:', '')
    .replace('urn:li:company:', '')
    .replace('urn:li:organizationBrand:', '')

export const isPrivateLinkedInMember = (member: IMemberData): boolean => {
  return single(member.identities, (i) => i.platform === PlatformType.LINKEDIN).username.startsWith(
    'private-',
  )
}
