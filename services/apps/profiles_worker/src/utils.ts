import { IMemberIdentity, MemberIdentityType } from '@crowd/types'

import { MemberBotSignal, MemberBotSignalStrength, MemberBotSignalType } from './types/member'

export function sortMemberIdentities(identities: IMemberIdentity[]): IMemberIdentity[] {
  const identityTypePriority = {
    [MemberIdentityType.USERNAME]: 0,
    [MemberIdentityType.EMAIL]: 1,
  }

  return identities.sort((a, b) => {
    // First, sort by verified status
    if (a.verified && !b.verified) return -1
    if (!a.verified && b.verified) return 1

    // Then, sort by type priority
    return identityTypePriority[a.type] - identityTypePriority[b.type]
  })
}

export function calculateMemberBotConfidence(signals: MemberBotSignal): number {
  const signalEntries = Object.entries(signals)

  if (signalEntries.length === 0) {
    return 0
  }

  const baseScores = {
    [MemberBotSignalStrength.WEAK]: 0.15,
    [MemberBotSignalStrength.MEDIUM]: 0.3,
    [MemberBotSignalStrength.STRONG]: 0.75,
  }

  const priorityMultipliers = {
    [MemberBotSignalType.IDENTITIES]: 1.0,
    [MemberBotSignalType.BIO]: 0.9,
    [MemberBotSignalType.DISPLAY_NAME]: 0.8,
  }

  const initialScores = signalEntries.map(([type, strength]) => {
    const base = baseScores[strength]
    const multiplier = priorityMultipliers[type as MemberBotSignalType]
    return base * multiplier
  })

  const maxScore = Math.max(...initialScores)
  let finalConfidence = maxScore

  const booster = 0.1
  const numberOfAdditionalSignals = signalEntries.length - 1
  finalConfidence += numberOfAdditionalSignals * booster

  // cap the final score to a maximum of 0.95 to avoid overconfidence
  return Math.min(0.95, finalConfidence)
}
