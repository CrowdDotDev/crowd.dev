import { get as getLevenshteinDistance } from 'fast-levenshtein'

import { MemberIdentityType } from '@crowd/types'
import {
  IMemberIdentityOpensearch,
  IMemberOrganizationOpensearch,
  IMemberPartialAggregatesOpensearch,
  ISimilarMember,
} from './types'
import { MemberAttributeOpensearch } from './enums'

class MemberSimilarityCalculator {
  static HIGH_CONFIDENCE_SCORE = 0.9
  static LOW_CONFIDENCE_SCORE = 0.2

  static calculateSimilarity(
    primaryMember: IMemberPartialAggregatesOpensearch,
    similarMember: ISimilarMember,
  ): number {
    let smallestEditDistance: number = null

    let similarPrimaryIdentity: IMemberIdentityOpensearch = null

    // return a small confidence score when there's clashing identities
    // clashing identities are username identities in same platform and different values
    if (this.hasClashingMemberIdentities(primaryMember, similarMember)) {
      return 0.2
    }

    // check displayName match
    if (
      similarMember.keyword_displayName.toLowerCase() ===
      primaryMember.keyword_displayName.toLowerCase()
    ) {
      return this.decideMemberSimilarityUsingAdditionalChecks(primaryMember, similarMember)
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
    const identityLength = similarPrimaryIdentity?.string_value.length || 0

    if (identityLength < smallestEditDistance) {
      return this.LOW_CONFIDENCE_SCORE
    }

    return this.decideMemberSimilarityUsingAdditionalChecks(
      primaryMember,
      similarMember,
      Math.floor(((identityLength - smallestEditDistance) / identityLength) * 100) / 100,
    )
  }

  static hasClashingMemberIdentities(
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

  static hasSameLocation(
    member: IMemberPartialAggregatesOpensearch,
    similarMember: ISimilarMember,
  ): boolean {
    const primaryMemberLocation = this.getLocation(member)
    const similarMemberLocation = this.getLocation(similarMember)

    return (
      primaryMemberLocation &&
      similarMemberLocation &&
      primaryMemberLocation.toLowerCase() === similarMemberLocation.toLowerCase()
    )
  }

  static hasSameAvatarUrl(
    member: IMemberPartialAggregatesOpensearch,
    similarMember: ISimilarMember,
  ): boolean {
    const primaryMemberAvatar = this.getAvatarUrl(member)
    const similarMemberAvatar = this.getAvatarUrl(similarMember)

    return (
      primaryMemberAvatar &&
      similarMemberAvatar &&
      primaryMemberAvatar.toLowerCase() === similarMemberAvatar.toLowerCase()
    )
  }

  static hasSameTimezone(
    member: IMemberPartialAggregatesOpensearch,
    similarMember: ISimilarMember,
  ): boolean {
    const primaryMemberTimezone = this.getTimezone(member)
    const similarMemberTimezone = this.getTimezone(similarMember)

    return (
      primaryMemberTimezone &&
      similarMemberTimezone &&
      primaryMemberTimezone.toLowerCase() === similarMemberTimezone.toLowerCase()
    )
  }

  static hasIntersectingLanguages(
    member: IMemberPartialAggregatesOpensearch,
    similarMember: ISimilarMember,
  ): boolean {
    const primaryMemberLanguages = this.getLanguages(member).filter((l) => l !== 'English')
    const similarMemberLanguages = this.getLanguages(similarMember).filter((l) => l !== 'English')

    return (
      primaryMemberLanguages &&
      primaryMemberLanguages.length > 0 &&
      similarMemberLanguages &&
      similarMemberLanguages.length > 0 &&
      primaryMemberLanguages.some((l) => similarMemberLanguages.includes(l))
    )
  }

  static hasIntersectingProgrammingLanguages(
    member: IMemberPartialAggregatesOpensearch,
    similarMember: ISimilarMember,
  ): boolean {
    const primaryMemberProgrammingLanguages = this.getProgrammingLanguages(member)
    const similarMemberProgrammingLanguages = this.getProgrammingLanguages(similarMember)

    return (
      primaryMemberProgrammingLanguages &&
      primaryMemberProgrammingLanguages.length > 0 &&
      similarMemberProgrammingLanguages &&
      similarMemberProgrammingLanguages.length > 0 &&
      primaryMemberProgrammingLanguages.some((l) => similarMemberProgrammingLanguages.includes(l))
    )
  }

  static hasRolesInSameOrganization(
    member: IMemberPartialAggregatesOpensearch,
    similarMember: ISimilarMember,
  ): boolean {
    for (const memberRoles of member.nested_organizations) {
      if (
        similarMember.nested_organizations.some(
          (o) => memberRoles.string_displayName === o.string_displayName,
        )
      ) {
        return true
      }
    }
    return false
  }

  static decideMemberSimilarityUsingAdditionalChecks(
    member: IMemberPartialAggregatesOpensearch,
    similarMember: ISimilarMember,
    startingScore?: number,
  ): number {
    let isHighConfidence = false
    let confidenceScore = startingScore || this.HIGH_CONFIDENCE_SCORE

    const bumpFactor = Math.floor((1 - confidenceScore) / 5)

    if (this.hasSameLocation(member, similarMember)) {
      isHighConfidence = true
      confidenceScore = this.bumpConfidenceScore(confidenceScore, bumpFactor)
    }

    if (this.hasRolesInSameOrganization(member, similarMember)) {
      isHighConfidence = true
      confidenceScore = this.bumpConfidenceScore(confidenceScore, bumpFactor)
    }

    if (this.hasIntersectingLanguages(member, similarMember)) {
      isHighConfidence = true
      confidenceScore = this.bumpConfidenceScore(confidenceScore, bumpFactor)
    }

    if (this.hasIntersectingProgrammingLanguages(member, similarMember)) {
      isHighConfidence = true
      confidenceScore = this.bumpConfidenceScore(confidenceScore, bumpFactor)
    }

    if (this.hasSameTimezone(member, similarMember)) {
      isHighConfidence = true
      confidenceScore = this.bumpConfidenceScore(confidenceScore, bumpFactor)
    }

    if (!isHighConfidence) {
      return this.LOW_CONFIDENCE_SCORE
    }

    return confidenceScore
  }

  static bumpConfidenceScore(confidenceScore: number, bump: number): number {
    return Math.min(1, confidenceScore + bump)
  }

  static getLocation(member: ISimilarMember | IMemberPartialAggregatesOpensearch): string {
    return member.obj_attributes[MemberAttributeOpensearch.LOCATION]?.string_default || null
  }

  static getAvatarUrl(member: ISimilarMember | IMemberPartialAggregatesOpensearch): string {
    return member.obj_attributes[MemberAttributeOpensearch.AVATAR_URL]?.string_default || null
  }

  static getLanguages(member: ISimilarMember | IMemberPartialAggregatesOpensearch): string[] {
    return member.obj_attributes[MemberAttributeOpensearch.AVATAR_URL]?.string_arr_default || []
  }

  static getTimezone(member: ISimilarMember | IMemberPartialAggregatesOpensearch): string {
    return member.obj_attributes[MemberAttributeOpensearch.AVATAR_URL]?.string_default || null
  }

  static getProgrammingLanguages(
    member: ISimilarMember | IMemberPartialAggregatesOpensearch,
  ): string[] {
    return member.obj_attributes[MemberAttributeOpensearch.AVATAR_URL]?.string_arr_default || []
  }

  static getOrganizations(
    member: ISimilarMember | IMemberPartialAggregatesOpensearch,
  ): IMemberOrganizationOpensearch[] {
    return member.nested_organizations || null
  }
}

export default MemberSimilarityCalculator
