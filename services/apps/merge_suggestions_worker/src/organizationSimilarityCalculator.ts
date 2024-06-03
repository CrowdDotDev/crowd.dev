import { get as getLevenshteinDistance } from 'fast-levenshtein'
import {
  IOrganizationIdentityOpensearch,
  IOrganizationPartialAggregatesOpensearch,
  ISimilarOrganization,
} from './types'

class OrganizationSimilarityCalculator {
  static HIGH_CONFIDENCE_SCORE = 0.9
  static MEDIUM_CONFIDENCE_SCORE = 0.75
  static LOW_CONFIDENCE_SCORE = 0.2

  static calculateSimilarity(
    primaryOrganization: IOrganizationPartialAggregatesOpensearch,
    similarOrganization: ISimilarOrganization,
  ): number {
    let smallestEditDistance: number = null

    let similarPrimaryIdentity: IOrganizationIdentityOpensearch = null

    if (this.hasClashingOrganizationIdentities(primaryOrganization, similarOrganization)) {
      return 0.2
    }

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
      if (
        similarOrganization.keyword_displayName.toLowerCase() ===
        primaryOrganization.keyword_displayName.toLowerCase()
      ) {
        return this.decideSimilarityUsingAdditionalChecks(primaryOrganization, similarOrganization)
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
    const identityLength = similarPrimaryIdentity?.string_name.length || 0

    if (identityLength < smallestEditDistance) {
      return this.LOW_CONFIDENCE_SCORE
    }

    return this.decideSimilarityUsingAdditionalChecks(
      primaryOrganization,
      similarOrganization,
      Math.floor(((identityLength - smallestEditDistance) / identityLength) * 100) / 100,
    )
  }

  static decideSimilarityUsingAdditionalChecks(
    organization: IOrganizationPartialAggregatesOpensearch,
    similarOrganization: ISimilarOrganization,
    startingScore?: number,
  ): number {
    let isHighConfidence = false
    let confidenceScore = startingScore || this.HIGH_CONFIDENCE_SCORE

    const bumpFactor = Math.floor((1 - confidenceScore) / 5)

    if (this.hasSameLocation(organization, similarOrganization)) {
      isHighConfidence = true
      confidenceScore = this.bumpConfidenceScore(confidenceScore, bumpFactor)
    }

    if (this.hasSameIndustry(organization, similarOrganization)) {
      isHighConfidence = true
      confidenceScore = this.bumpConfidenceScore(confidenceScore, bumpFactor)
    }

    if (this.hasSameTicker(organization, similarOrganization)) {
      isHighConfidence = true
      confidenceScore = this.bumpConfidenceScore(confidenceScore, bumpFactor)
    }

    if (this.hasSameWebsite(organization, similarOrganization)) {
      isHighConfidence = true
      confidenceScore = this.bumpConfidenceScore(confidenceScore, bumpFactor)
    }

    if (!isHighConfidence) {
      return this.MEDIUM_CONFIDENCE_SCORE
    }

    return confidenceScore
  }

  static bumpConfidenceScore(confidenceScore: number, bump: number): number {
    return Math.min(1, confidenceScore + bump)
  }

  static hasClashingOrganizationIdentities(
    organization: IOrganizationPartialAggregatesOpensearch,
    similarOrganization: ISimilarOrganization,
  ): boolean {
    if (organization.nested_identities && organization.nested_identities.length > 0) {
      for (const identity of organization.nested_identities) {
        if (
          similarOrganization.nested_identities.some(
            (i) =>
              i.string_platform === identity.string_platform &&
              i.keyword_name !== identity.keyword_name,
          )
        ) {
          return true
        }
      }
    }

    return false
  }

  static hasSameLocation(
    organization: IOrganizationPartialAggregatesOpensearch,
    similarOrganization: ISimilarOrganization,
  ): boolean {
    return (
      organization.string_location &&
      similarOrganization.string_location &&
      organization.string_location.toLowerCase() ===
        similarOrganization.string_location.toLowerCase()
    )
  }

  static hasSameWebsite(
    organization: IOrganizationPartialAggregatesOpensearch,
    similarOrganization: ISimilarOrganization,
  ): boolean {
    return (
      organization.string_website &&
      similarOrganization.string_website &&
      organization.string_website.toLowerCase() === similarOrganization.string_website.toLowerCase()
    )
  }

  static hasSameIndustry(
    organization: IOrganizationPartialAggregatesOpensearch,
    similarOrganization: ISimilarOrganization,
  ): boolean {
    return (
      organization.string_industry &&
      similarOrganization.string_industry &&
      organization.string_industry.toLowerCase() ===
        similarOrganization.string_industry.toLowerCase()
    )
  }

  static hasSameTicker(
    organization: IOrganizationPartialAggregatesOpensearch,
    similarOrganization: ISimilarOrganization,
  ): boolean {
    return (
      organization.string_ticker &&
      similarOrganization.string_ticker &&
      organization.string_ticker.toLowerCase() === similarOrganization.string_ticker.toLowerCase()
    )
  }
}

export default OrganizationSimilarityCalculator
