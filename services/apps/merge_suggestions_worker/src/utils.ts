import { get as getLevenshteinDistance } from 'fast-levenshtein'

import {
  IMemberIdentityOpensearch,
  IMemberOrganizationOpensearch,
  IMemberPartialAggregatesOpensearch,
  IOrganizationIdentityOpensearch,
  IOrganizationPartialAggregatesOpensearch,
  ISimilarMember,
  ISimilarOrganization,
} from './types'
import { MemberAttributeOpensearch } from './enums'
import { MemberIdentityType } from '@crowd/types'

const LOW_CONFIDENCE_SCORE = 0.2
const HIGH_CONFIDENCE_SCORE = 0.9

export const prefixLength = (string: string) => {
  if (string.length > 5 && string.length < 8) {
    return 6
  }

  return 10
}

export const calculateMemberSimilarity = (
  primaryMember: IMemberPartialAggregatesOpensearch,
  similarMember: ISimilarMember,
): number => {
  let smallestEditDistance: number = null

  let similarPrimaryIdentity: IMemberIdentityOpensearch = null

  // return a small confidence score when there's clashing identities
  // clashing identities are username identities in same platform and different values
  if (hasClashingIdentities(primaryMember, similarMember)) {
    return 0.2
  }

  // check displayName match
  if (
    similarMember.keyword_displayName.toLowerCase() ===
    primaryMember.keyword_displayName.toLowerCase()
  ) {
    return decideSimilarityUsingAdditionalChecks(primaryMember, similarMember)
  }

  // We check if there are any verified<->unverified email matches between primary & similar members
  if (
    (similarMember.string_arr_unverifiedEmails &&
      similarMember.string_arr_unverifiedEmails.length > 0 &&
      similarMember.string_arr_unverifiedEmails.some((email) =>
        primaryMember.string_arr_verifiedEmails.includes(email),
      )) ||
    (similarMember.string_arr_verifiedEmails &&
      similarMember.string_arr_verifiedEmails.length > 0 &&
      similarMember.string_arr_verifiedEmails.some((email) =>
        primaryMember.string_arr_unverifiedEmails.includes(email),
      ))
  ) {
    return 0.98
  }

  // check primary unverified identity <-> secondary verified identity exact match
  for (const primaryIdentity of primaryMember.nested_identities.filter((i) => !i.bool_verified)) {
    if (
      similarMember.nested_identities &&
      similarMember.nested_identities.length > 0 &&
      similarMember.nested_identities.some(
        (verifiedIdentity) =>
          verifiedIdentity.bool_verified &&
          verifiedIdentity.string_value === primaryIdentity.string_value &&
          verifiedIdentity.keyword_type === primaryIdentity.keyword_type &&
          verifiedIdentity.string_platform === primaryIdentity.string_platform,
      )
    ) {
      return 0.98
    }
  }

  for (const primaryIdentity of primaryMember.nested_identities.filter((i) => i.bool_verified)) {
    // similar member has an unverified identity as one of primary members's verified identity, return score 95
    if (
      similarMember.nested_identities &&
      similarMember.nested_identities.length > 0 &&
      similarMember.nested_identities.some(
        (unverifiedIdentity) =>
          unverifiedIdentity.bool_verified === false &&
          unverifiedIdentity.string_value === primaryIdentity.string_value &&
          unverifiedIdentity.keyword_type === primaryIdentity.keyword_type &&
          unverifiedIdentity.string_platform === primaryIdentity.string_platform,
      )
    ) {
      return 0.95
    }

    for (const secondaryIdentity of similarMember.nested_identities.filter(
      (i) => i.bool_verified,
    )) {
      const currentLevenstheinDistance = getLevenshteinDistance(
        `${primaryIdentity.string_value}`,
        `${secondaryIdentity.string_value}`,
      )
      if (smallestEditDistance === null || smallestEditDistance > currentLevenstheinDistance) {
        smallestEditDistance = currentLevenstheinDistance
        similarPrimaryIdentity = primaryIdentity
      }
    }
  }

  // calculate similarity percentage
  const identityLength = similarPrimaryIdentity.string_value.length

  if (identityLength < smallestEditDistance) {
    return LOW_CONFIDENCE_SCORE
  }

  return decideSimilarityUsingAdditionalChecks(
    primaryMember,
    similarMember,
    Math.floor(((identityLength - smallestEditDistance) / identityLength) * 100) / 100,
  )
}

export const calculateOrganizationSimilarity = (
  primaryOrganization: IOrganizationPartialAggregatesOpensearch,
  similarOrganization: ISimilarOrganization,
): number => {
  let smallestEditDistance: number = null

  let similarPrimaryIdentity: IOrganizationIdentityOpensearch = null

  // find the smallest edit distance between both identity arrays
  for (const primaryIdentity of primaryOrganization.nested_identities) {
    // similar organization has a weakIdentity as one of primary organization's strong identity, return score 95
    if (
      similarOrganization.nested_weakIdentities &&
      similarOrganization.nested_weakIdentities.length > 0 &&
      similarOrganization.nested_weakIdentities.some(
        (weakIdentity) =>
          weakIdentity.string_name === primaryIdentity.string_name &&
          weakIdentity.string_platform === primaryIdentity.string_platform,
      )
    ) {
      return 0.95
    }

    // check displayName match
    if (similarOrganization.keyword_displayName === primaryOrganization.keyword_displayName) {
      return 0.98
    }

    for (const secondaryIdentity of similarOrganization.nested_identities) {
      const currentLevenstheinDistance = getLevenshteinDistance(
        primaryIdentity.string_name,
        secondaryIdentity.string_name,
      )
      if (smallestEditDistance === null || smallestEditDistance > currentLevenstheinDistance) {
        smallestEditDistance = currentLevenstheinDistance
        similarPrimaryIdentity = primaryIdentity
      }
    }
  }

  // calculate similarity percentage
  const identityLength = similarPrimaryIdentity.string_name.length

  if (identityLength < smallestEditDistance) {
    // if levensthein distance is bigger than the word itself, it might be a prefix match, return medium similarity
    return (Math.floor(Math.random() * 21) + 20) / 100
  }

  return Math.floor(((identityLength - smallestEditDistance) / identityLength) * 100) / 100
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

export function decideSimilarityUsingAdditionalChecks(
  member: IMemberPartialAggregatesOpensearch,
  similarMember: ISimilarMember,
  startingScore?: number,
): number {
  let isHighConfidence = false
  let confidenceScore = startingScore || HIGH_CONFIDENCE_SCORE

  const bumpFactor = Math.floor((1 - confidenceScore) / 5)

  if (hasSameLocation(member, similarMember)) {
    isHighConfidence = true
    confidenceScore = bumpConfidenceScore(confidenceScore, bumpFactor)
  }

  if (hasRolesInSameOrganization(member, similarMember)) {
    isHighConfidence = true
    confidenceScore = bumpConfidenceScore(confidenceScore, bumpFactor)
  }

  if (hasIntersectingLanguages(member, similarMember)) {
    isHighConfidence = true
    confidenceScore = bumpConfidenceScore(confidenceScore, bumpFactor)
  }

  if (hasIntersectingProgrammingLanguages(member, similarMember)) {
    isHighConfidence = true
    confidenceScore = bumpConfidenceScore(confidenceScore, bumpFactor)
  }

  if (hasSameTimezone(member, similarMember)) {
    isHighConfidence = true
    confidenceScore = bumpConfidenceScore(confidenceScore, bumpFactor)
  }

  if (!isHighConfidence) {
    return LOW_CONFIDENCE_SCORE
  }

  return confidenceScore
}

export function bumpConfidenceScore(confidenceScore: number, bump: number): number {
  return Math.min(1, confidenceScore + bump)
}

export function getLocation(member: ISimilarMember | IMemberPartialAggregatesOpensearch): string {
  return member.obj_attributes[MemberAttributeOpensearch.LOCATION]?.string_default || null
}

export function getAvatarUrl(member: ISimilarMember | IMemberPartialAggregatesOpensearch): string {
  return member.obj_attributes[MemberAttributeOpensearch.AVATAR_URL]?.string_default || null
}

export function getLanguages(
  member: ISimilarMember | IMemberPartialAggregatesOpensearch,
): string[] {
  return member.obj_attributes[MemberAttributeOpensearch.AVATAR_URL]?.string_arr_default || null
}

export function getTimezone(member: ISimilarMember | IMemberPartialAggregatesOpensearch): string {
  return member.obj_attributes[MemberAttributeOpensearch.AVATAR_URL]?.string_default || null
}

export function getProgrammingLanguages(
  member: ISimilarMember | IMemberPartialAggregatesOpensearch,
): string[] {
  return member.obj_attributes[MemberAttributeOpensearch.AVATAR_URL]?.string_arr_default || null
}

export function getOrganizations(
  member: ISimilarMember | IMemberPartialAggregatesOpensearch,
): IMemberOrganizationOpensearch[] {
  return member.nested_organizations || null
}

export function hasClashingIdentities(
  member: IMemberPartialAggregatesOpensearch,
  similarMember: ISimilarMember,
): boolean {
  if (member.nested_identities && member.nested_identities.length > 0) {
    for (const identity of member.nested_identities) {
      if (
        similarMember.nested_identities.some(
          (i) =>
            i.keyword_type === MemberIdentityType.USERNAME &&
            i.string_platform === identity.string_platform &&
            i.keyword_value !== identity.keyword_value,
        )
      ) {
        return true
      }
    }
  }

  return false
}

export function hasSameLocation(
  member: IMemberPartialAggregatesOpensearch,
  similarMember: ISimilarMember,
): boolean {
  const primaryMemberLocation = getLocation(member)
  const similarMemberLocation = getLocation(similarMember)

  return (
    primaryMemberLocation &&
    similarMemberLocation &&
    primaryMemberLocation.toLowerCase() === similarMemberLocation.toLowerCase()
  )
}

export function hasSameAvatarUrl(
  member: IMemberPartialAggregatesOpensearch,
  similarMember: ISimilarMember,
): boolean {
  const primaryMemberAvatar = getAvatarUrl(member)
  const similarMemberAvatar = getAvatarUrl(similarMember)

  return (
    primaryMemberAvatar &&
    similarMemberAvatar &&
    primaryMemberAvatar.toLowerCase() === similarMemberAvatar.toLowerCase()
  )
}

export function hasSameTimezone(
  member: IMemberPartialAggregatesOpensearch,
  similarMember: ISimilarMember,
): boolean {
  const primaryMemberTimezone = getTimezone(member)
  const similarMemberTimezone = getTimezone(similarMember)

  return (
    primaryMemberTimezone &&
    similarMemberTimezone &&
    primaryMemberTimezone.toLowerCase() === similarMemberTimezone.toLowerCase()
  )
}

export function hasIntersectingLanguages(
  member: IMemberPartialAggregatesOpensearch,
  similarMember: ISimilarMember,
): boolean {
  const primaryMemberLanguages = getLanguages(member).filter((l) => l !== 'English')
  const similarMemberLanguages = getLanguages(similarMember).filter((l) => l !== 'English')

  return (
    primaryMemberLanguages &&
    primaryMemberLanguages.length > 0 &&
    similarMemberLanguages &&
    similarMemberLanguages.length > 0 &&
    primaryMemberLanguages.some((l) => similarMemberLanguages.includes(l))
  )
}

export function hasIntersectingProgrammingLanguages(
  member: IMemberPartialAggregatesOpensearch,
  similarMember: ISimilarMember,
): boolean {
  const primaryMemberProgrammingLanguages = getProgrammingLanguages(member)
  const similarMemberProgrammingLanguages = getProgrammingLanguages(similarMember)

  return (
    primaryMemberProgrammingLanguages &&
    primaryMemberProgrammingLanguages.length > 0 &&
    similarMemberProgrammingLanguages &&
    similarMemberProgrammingLanguages.length > 0 &&
    primaryMemberProgrammingLanguages.some((l) => similarMemberProgrammingLanguages.includes(l))
  )
}

export function hasRolesInSameOrganization(
  member: IMemberPartialAggregatesOpensearch,
  similarMember: ISimilarMember,
): boolean {
  for (const memberRoles of member.nested_organizations) {
    if (similarMember.nested_organizations.some((o) => memberRoles.uuid_id === o.uuid_id)) {
      return true
    }
  }
  return false
}
