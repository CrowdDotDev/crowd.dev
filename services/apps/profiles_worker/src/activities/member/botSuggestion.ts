import axios from 'axios'

import {
  MemberField,
  deleteMemberOrganizations,
  fetchMemberIdentities,
  findMemberById,
  insertBotSuggestion,
} from '@crowd/data-access-layer'
import { IDbBotSuggestionInsert } from '@crowd/data-access-layer/src/members/types'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { BotSuggestionStatus, IAttributes, IMemberData } from '@crowd/types'

import { svc } from '../../main'

export async function createBotSuggestion(
  suggestion: Pick<IDbBotSuggestionInsert, 'memberId' | 'confidence'>,
): Promise<void> {
  try {
    const qx = pgpQx(svc.postgres.writer.connection())
    await insertBotSuggestion(qx, { ...suggestion, status: BotSuggestionStatus.PENDING })
  } catch (error) {
    svc.log.error({ error, suggestion }, `Failed to create bot suggestion!`)

    throw error
  }
}

export async function findMember(memberId: string): Promise<IMemberData | null> {
  try {
    const qx = pgpQx(svc.postgres.reader.connection())

    const [member, identities] = await Promise.all([
      findMemberById(qx, memberId, [MemberField.DISPLAY_NAME, MemberField.ATTRIBUTES]),
      fetchMemberIdentities(qx, memberId),
    ])

    if (!member) {
      return null
    }

    return { ...member, identities }
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
