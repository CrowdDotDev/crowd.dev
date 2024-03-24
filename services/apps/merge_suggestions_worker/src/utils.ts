import { get as getLevenshteinDistance } from 'fast-levenshtein'

import {
  IMemberIdentityOpensearch,
  IMemberPartialAggregatesOpensearch,
  ISimilarMember,
} from './types'

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

  // We check if there are any verified<->unverified email matches between primary & similar members
  if (
    (similarMember.string_arr_unverifiedEmails.length > 0 &&
      similarMember.string_arr_unverifiedEmails.some((email) =>
        primaryMember.string_arr_verifiedEmails.includes(email),
      )) ||
    (similarMember.string_arr_verifiedEmails.length > 0 &&
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
