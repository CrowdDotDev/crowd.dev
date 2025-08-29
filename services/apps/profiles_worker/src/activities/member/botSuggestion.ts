import axios from 'axios'

import {
  MemberField,
  deleteMemberOrganizations,
  fetchMemberIdentities,
  findMemberById,
  insertMemberBotSuggestion,
  insertMemberNoBot,
} from '@crowd/data-access-layer'
import { IDbMemberBotSuggestionInsert } from '@crowd/data-access-layer/src/members/types'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { IAttributes, IMemberIdentity, MemberIdentityType } from '@crowd/types'

import { svc } from '../../main'
import { MemberBotSignal, MemberBotSignalStrength, MemberBotSignalType, MemberForLLMBotSuggestion } from '../../types/member'

function sortMemberIdentities(identities: IMemberIdentity[]): IMemberIdentity[] {
  const typePriority = {
    [MemberIdentityType.USERNAME]: 0,
    [MemberIdentityType.EMAIL]: 1,
  }

  return identities.sort((a, b) => {
    // First, sort by verified status
    if (a.verified && !b.verified) return -1
    if (!a.verified && b.verified) return 1

    // Then, sort by type priority
    return typePriority[a.type] - typePriority[b.type]
  })
}

export async function getMemberForBotAnalysis(
  memberId: string,
): Promise<MemberForLLMBotSuggestion | null> {
  try {
    const qx = pgpQx(svc.postgres.reader.connection())

    const [member, identities] = await Promise.all([
      findMemberById(qx, memberId, [MemberField.DISPLAY_NAME, MemberField.ATTRIBUTES]),
      fetchMemberIdentities(qx, memberId),
    ])

    if (!member) {
      return null
    }

    return {
      displayName: member.displayName,
      bio: member.attributes?.bio ?? null,
      identities: sortMemberIdentities(identities),
    }
  } catch (error) {
    svc.log.error({ error, memberId }, `Failed to find member!`)
    throw error
  }
}

export async function updateMemberAttributes(
  memberId: string,
  attributes: IAttributes,
): Promise<void> {
  const url = `${process.env['CROWD_API_SERVICE_URL']}/member/${memberId}/attributes`
  const requestOptions = {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env['CROWD_API_SERVICE_USER_TOKEN']}`,
      'Content-Type': 'application/json',
    },
    data: {
      ...attributes,
    },
    params: {
      manuallyChanged: false,
    },
  }

  try {
    await axios(url, requestOptions)
  } catch (error) {
    svc.log.error(
      { error, memberId },
      `Failed updating member attributes with status [${error.response?.status}]`,
    )

    throw error
  }
}

export async function removeMemberOrganizations(memberId: string): Promise<void> {
  try {
    const qx = pgpQx(svc.postgres.writer.connection())
    await deleteMemberOrganizations(qx, memberId, undefined, false)
  } catch (error) {
    svc.log.error({ error, memberId }, `Failed to remove member organizations!`)
    throw error
  }
}

export async function createMemberBotSuggestion(
  suggestion: IDbMemberBotSuggestionInsert,
): Promise<void> {
  try {
    const qx = pgpQx(svc.postgres.writer.connection())
    await insertMemberBotSuggestion(qx, suggestion)
  } catch (error) {
    svc.log.error({ error, suggestion }, `Failed to create member bot suggestion!`)

    throw error
  }
}

export async function createMemberNoBot(memberId: string): Promise<void> {
  try {
    const qx = pgpQx(svc.postgres.writer.connection())
    await insertMemberNoBot(qx, memberId)
  } catch (error) {
    svc.log.error({ error, memberId }, `Failed to create member no bot!`)

    throw error
  }
}

export async function calculateMemberBotConfidence(signals: MemberBotSignal): Promise<number> {
  const weights = {
    [MemberBotSignalStrength.WEAK]: 0.1,
    [MemberBotSignalStrength.MEDIUM]: 0.3,
    [MemberBotSignalStrength.STRONG]: 0.5,
  }
  
  const typeMultipliers = {
    [MemberBotSignalType.IDENTITIES]: 1,
    [MemberBotSignalType.BIO]: 1.2,
    [MemberBotSignalType.DISPLAY_NAME]: 1.0,
  }

  const totalScore = Object.entries(signals).reduce((score, [type, strength]) => {
    return score + weights[strength] * typeMultipliers[type as MemberBotSignalType]
  }, 0)

  const maxPossibleScore = weights[MemberBotSignalStrength.STRONG] * typeMultipliers[MemberBotSignalType.IDENTITIES]

  return Math.min(1.0, Math.max(0.1, totalScore / maxPossibleScore))
}