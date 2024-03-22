import { get as getLevenshteinDistance } from 'fast-levenshtein'

import {
  IMemberIdentityOpensearch,
  IMemberPartialAggregatesOpensearch,
  ISimilarMember,
} from './types'
import { MemberIdentityType } from '@crowd/types'

export const prefixLength = (string: string) => {
  if (string.length > 5 && string.length < 8) {
    return 6
  }

  return 10
}

export const calculateSimilarity = (
  primaryMember: IMemberPartialAggregatesOpensearch,
  similarMember: ISimilarMember,
): number => {
  let smallestEditDistance: number = null

  let similarPrimaryIdentity: IMemberIdentityOpensearch = null

  // check displayName match
  if (
    similarMember.keyword_displayName.toLowerCase() ===
    primaryMember.keyword_displayName.toLowerCase()
  ) {
    return 0.98
  }

  // check email match
  // TODO uros ask anil - verified vs unverified emails
  // which ones to use here for which member?
  if (
    similarMember.string_arr_verifiedEmails.length > 0 &&
    similarMember.string_arr_verifiedEmails.some((email) =>
      primaryMember.string_arr_verifiedEmails.includes(email),
    )
  ) {
    return 0.98
  }

  // find the smallest edit distance between both identity arrays
  // TODO uros ask anil - verified vs unverified identities
  // I provided verifiedEmails, unverifiedEmails and verifiedUsernames, unverifiedUsernames
  // so we don't have to deal with identities array and how it looks now
  // but I'm confused how to use it here in terms of verified vs unverified
  // there is also no more weakIdentities -> they have been converted to unverifiedUsernames
  // emails have been also converted to verified/unverified emails based on if and when the member was enriched
  // so now all we have are verified/unverified emails and usernames
  for (const primaryIdentity of primaryMember.nested_identities.filter(
    (i) => i.bool_verified && i.string_type === MemberIdentityType.USERNAME,
  )) {
    // similar organization has a weakIdentity as one of primary organization's strong identity, return score 95
    if (
      similarMember.nested_identities &&
      similarMember.nested_identities.length > 0 &&
      similarMember.nested_identities.some(
        (weakIdentity) =>
          weakIdentity.bool_verified === false &&
          weakIdentity.string_value === primaryIdentity.string_value &&
          weakIdentity.string_type === primaryIdentity.string_type &&
          weakIdentity.string_platform === primaryIdentity.string_platform,
      )
    ) {
      return 0.95
    }

    for (const secondaryIdentity of similarMember.nested_identities.filter(
      (i) => i.bool_verified,
    )) {
      const currentLevenstheinDistance = getLevenshteinDistance(
        `${primaryIdentity.string_type}:${primaryIdentity.string_value}`,
        `${secondaryIdentity.string_type}:${secondaryIdentity.string_value}`,
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
