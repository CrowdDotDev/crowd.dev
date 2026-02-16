import { IActivityData, IMemberData, MemberIdentityType, PlatformType } from '@crowd/types'

import { TransformerBase } from '../../core/transformerBase'

export class CventTransformer extends TransformerBase {
  readonly platform = PlatformType.CVENT

  transformRow(row: Record<string, any>): IActivityData | null {
    const userName = (row.USER_NAME as string | null)?.trim() || null
    const fullName = (row.FULL_NAME as string | null)?.trim() || null
    const firstName = (row.FIRST_NAME as string | null)?.trim() || null
    const lastName = (row.LAST_NAME as string | null)?.trim() || null
    const email = (row.EMAIL as string)?.trim()
    const registrationId = (row.REGISTRATION_ID as string)?.trim()

    const displayName =
      fullName ||
      (firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName) ||
      userName

    const identities: IMemberData['identities'] = []
    const sourceId = (row.USER_ID as string | null) || undefined

    if (userName) {
      identities.push(
        {
          platform: PlatformType.LFID,
          value: email,
          type: MemberIdentityType.EMAIL,
          verified: true,
          sourceId,
        },
        {
          platform: PlatformType.LFID,
          value: userName,
          type: MemberIdentityType.USERNAME,
          verified: true,
          sourceId,
        },
      )
    } else {
      identities.push({
        platform: PlatformType.LFID,
        value: email,
        type: MemberIdentityType.USERNAME,
        verified: true,
        sourceId,
      })
    }

    const type = row.USER_ATTENDED === true ? 'attended-event' : 'registered-event'

    const timestamp = (row.REGISTRATION_CREATED_TS as string | null) || null

    const price =
      row.REGISTRATION_REVENUE != null ? String(row.REGISTRATION_REVENUE as number) : null

    const activity: IActivityData = {
      type,
      platform: PlatformType.LFID,
      timestamp,
      score: 1,
      sourceId: registrationId,
      sourceParentId: row.EVENT_ID as string,
      member: {
        displayName,
        identities,
        organizations: row.ACCOUNT_NAME
          ? [
              {
                displayName: row.ACCOUNT_NAME as string,
                source: 'lfid' as never,
                identities: [],
              },
            ]
          : undefined,
      },
      attributes: {
        eventName: row.EVENT_NAME as string,
        eventDate: (row.EVENT_START_DATE as string | null) || null,
        location: (row.EVENT_LOCATION as string | null) || null,
        website:
          (row.EVENT_URL as string | null) === 'NULL' ? null : (row.EVENT_URL as string) || null,
        registrationType: (row.REGISTRATION_TYPE as string | null) || null,
        attendeeType: (row.EVENT_ATTENDANCE_TYPE as string | null) || null,
        voucherCode: null,
        price,
      },
    }

    return activity
  }
}
