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
    [MemberBotSignalStrength.WEAK]: 0.2,
    [MemberBotSignalStrength.MEDIUM]: 0.4,
    [MemberBotSignalStrength.STRONG]: 0.85,
  }

  const priorityMultipliers = {
    [MemberBotSignalType.IDENTITIES]: 1.0,
    [MemberBotSignalType.BIO]: 0.9,
    [MemberBotSignalType.DISPLAY_NAME]: 0.8,
  }

  // 1. Calculate the initial score for each signal found.
  const initialScores = signalEntries.map(([type, strength]) => {
    const base = baseScores[strength]
    const multiplier = priorityMultipliers[type as MemberBotSignalType]
    return base * multiplier
  })

  // 2. Find the highest, most influential signal score.
  const maxScore = Math.max(...initialScores)
  let finalConfidence = maxScore

  // 3. Add a small boost for each additional piece of corroborating evidence.
  const booster = 0.15
  const numberOfAdditionalSignals = signalEntries.length - 1
  finalConfidence += numberOfAdditionalSignals * booster

  return Math.min(1.0, parseFloat(finalConfidence.toFixed(2)))
}
