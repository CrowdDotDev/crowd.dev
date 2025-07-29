import { get as getLevenshteinDistance } from 'fast-levenshtein'

import { IOrganizationFullAggregatesOpensearch, IOrganizationIdentity } from '@crowd/types'

class OrganizationSimilarityCalculator {
  static HIGH_CONFIDENCE_SCORE = 0.9
  static MEDIUM_CONFIDENCE_SCORE = 0.75
  static LOW_CONFIDENCE_SCORE = 0.2

  static calculateSimilarity(
    primaryOrganization: IOrganizationFullAggregatesOpensearch,
    similarOrganization: IOrganizationFullAggregatesOpensearch,
  ): number {
    let smallestEditDistance: number = null

    let similarPrimaryIdentity: IOrganizationIdentity = null

    if (this.hasClashingOrganizationIdentities(primaryOrganization, similarOrganization)) {
      return 0.2
    }

    // find the smallest edit distance between both identity arrays
    for (const primaryIdentity of primaryOrganization.identities.filter((i) => i.verified)) {
      // similar organization has an unverified identity as one of primary organization's strong identity, return score 95
      if (
        similarOrganization.identities.some(
          (wi) =>
            !wi.verified &&
            wi.value === primaryIdentity.value &&
            wi.type === primaryIdentity.type &&
            wi.platform === primaryIdentity.platform,
        )
      ) {
        return 0.95
      }

      // check displayName match
      if (similarOrganization.displayName === primaryOrganization.displayName) {
        return this.decideSimilarityUsingAdditionalChecks(primaryOrganization, similarOrganization)
      }

      for (const secondaryIdentity of similarOrganization.identities) {
        const currentLevenstheinDistance = getLevenshteinDistance(
          primaryIdentity.value,
          secondaryIdentity.value,
        )
        if (smallestEditDistance === null || smallestEditDistance > currentLevenstheinDistance) {
          smallestEditDistance = currentLevenstheinDistance
          similarPrimaryIdentity = primaryIdentity
        }
      }
    }

    // calculate similarity percentage
    const identityLength = similarPrimaryIdentity?.value.length || 0

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
    organization: IOrganizationFullAggregatesOpensearch,
    similarOrganization: IOrganizationFullAggregatesOpensearch,
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

    if (!isHighConfidence) {
      return this.MEDIUM_CONFIDENCE_SCORE
    }

    return confidenceScore
  }

  static bumpConfidenceScore(confidenceScore: number, bump: number): number {
    return Math.min(1, confidenceScore + bump)
  }

  static hasClashingOrganizationIdentities(
    organization: IOrganizationFullAggregatesOpensearch,
    similarOrganization: IOrganizationFullAggregatesOpensearch,
  ): boolean {
    const primaryIdentities = organization.identities.filter((i) => i.verified);
    const similarIdentities = similarOrganization.identities.filter((i) => i.verified);

    if (similarIdentities.length === 0) {
      return false;
    }

    // Look for just ONE strong match to prove they are NOT clashing.
    for (const pIdentity of primaryIdentities) {
      for (const sIdentity of similarIdentities) {
        if (pIdentity.platform === sIdentity.platform && pIdentity.type === sIdentity.type) {
          const distance = getLevenshteinDistance(pIdentity.value, sIdentity.value);
          
          // Use different thresholds based on identity type
          let threshold = 0;
          
          if (pIdentity.type.includes('domain')) {
            // For domains: allow up to 3 changes (handles country domains like .com -> .de)
            threshold = 3;
          } else if (pIdentity.type === 'username') {
            // For usernames: be very strict, only allow 1 typo
            threshold = 1;
          } else {
            // For other types: be conservative
            threshold = 1;
          }
          
          if (distance <= threshold) {
            return false;
          }
        }
      }
    }

    return true;
  }

  static hasSameLocation(
    organization: IOrganizationFullAggregatesOpensearch,
    similarOrganization: IOrganizationFullAggregatesOpensearch,
  ): boolean {
    return (
      organization.location &&
      similarOrganization.location &&
      organization.location.toLowerCase() === similarOrganization.location.toLowerCase()
    )
  }

  static hasSameWebsite(
    organization: IOrganizationFullAggregatesOpensearch,
    similarOrganization: IOrganizationFullAggregatesOpensearch,
  ): boolean {
    return (
      organization.website &&
      similarOrganization.website &&
      organization.website.toLowerCase() === similarOrganization.website.toLowerCase()
    )
  }

  static hasSameIndustry(
    organization: IOrganizationFullAggregatesOpensearch,
    similarOrganization: IOrganizationFullAggregatesOpensearch,
  ): boolean {
    return (
      organization.industry &&
      similarOrganization.industry &&
      organization.industry.toLowerCase() === similarOrganization.industry.toLowerCase()
    )
  }

  static hasSameTicker(
    organization: IOrganizationFullAggregatesOpensearch,
    similarOrganization: IOrganizationFullAggregatesOpensearch,
  ): boolean {
    return (
      organization.ticker &&
      similarOrganization.ticker &&
      organization.ticker.toLowerCase() === similarOrganization.ticker.toLowerCase()
    )
  }
}

export default OrganizationSimilarityCalculator
