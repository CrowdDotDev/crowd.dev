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

  // check email match
  if (
    similarMember.string_arr_emails &&
    similarMember.string_arr_emails.length > 0 &&
    similarMember.string_arr_emails.some((email) => primaryMember.string_arr_emails.includes(email))
  ) {
    return 0.98
  }

  // find the smallest edit distance between both identity arrays
  for (const primaryIdentity of primaryMember.nested_identities) {
    // similar organization has a weakIdentity as one of primary organization's strong identity, return score 95
    if (
      similarMember.nested_weakIdentities &&
      similarMember.nested_weakIdentities.length > 0 &&
      similarMember.nested_weakIdentities.some(
        (weakIdentity) =>
          weakIdentity.string_username === primaryIdentity.string_username &&
          weakIdentity.string_platform === primaryIdentity.string_platform,
      )
    ) {
      return 0.95
    }

    for (const secondaryIdentity of similarMember.nested_identities) {
      const currentLevenstheinDistance = getLevenshteinDistance(
        primaryIdentity.string_username,
        secondaryIdentity.string_username,
      )
      if (smallestEditDistance === null || smallestEditDistance > currentLevenstheinDistance) {
        smallestEditDistance = currentLevenstheinDistance
        similarPrimaryIdentity = primaryIdentity
      }
    }
  }

  // calculate similarity percentage
  const identityLength = similarPrimaryIdentity.string_username.length

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
