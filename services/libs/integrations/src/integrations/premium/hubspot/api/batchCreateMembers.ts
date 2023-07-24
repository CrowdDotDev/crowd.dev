import { IGenerateStreamsContext, IProcessStreamContext } from '@/types'
import axios, { AxiosRequestConfig } from 'axios'
import { getNangoToken } from './../../../nango'
import { IMember, PlatformType } from '@crowd/types'
import { RequestThrottler } from '@crowd/common'
import { HubspotMemberFieldMapper } from '../field-mapper/memberFieldMapper'

export interface IBatchCreateMemberResult {
  memberId: string
  sourceId: string
}

export const batchCreateMembers = async (
  nangoId: string,
  members: IMember[],
  memberMapper: HubspotMemberFieldMapper,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  throttler: RequestThrottler,
): Promise<IBatchCreateMemberResult[]> => {
  const config: AxiosRequestConfig<unknown> = {
    method: 'post',
    url: `https://api.hubapi.com/crm/v3/objects/contacts/batch/create`,
    data: {},
    headers: {
      Authorization: '',
    },
  }

  try {
    const hubspotMembers = []

    for (const member of members) {
      const primaryEmail = member.emails.length > 0 ? member.emails[0] : null

      if (!primaryEmail) {
        ctx.log.warn(
          `Member ${member.id} can't be created in hubspot! Member doesn't have any associated email.`,
        )
      } else {
        const hsMember = {
          properties: {
            email: primaryEmail,
          },
        } as any

        const fields = memberMapper.getAllCrowdFields()

        for (const crowdField of fields) {
          const hubspotField = memberMapper.getHubspotFieldName(crowdField)
          if (crowdField.startsWith('attributes')) {
            const attributeName = crowdField.split('.')[1] || null

            if (
              attributeName &&
              hubspotField &&
              member.attributes[attributeName]?.default !== undefined
            ) {
              hsMember.properties[hubspotField] = member.attributes[attributeName].default
            }
          } else if (crowdField.startsWith('identities')) {
            const identityPlatform = crowdField.split('.')[1] || null
            if (identityPlatform && hubspotField && member.username[identityPlatform]?.[0]) {
              hsMember.properties[hubspotField] = member.username[identityPlatform][0]
            }
          } else if (crowdField === 'organizationName') {
            // send latest org of member as value
          } else if (hubspotField && member[crowdField] !== undefined) {
            hsMember.properties[hubspotField] = memberMapper.getHubspotValue(member, crowdField)
          }
        }

        if (Object.keys(hsMember.properties).length > 0) {
          hubspotMembers.push(hsMember)
        }
      }
    }

    config.data = {
      inputs: hubspotMembers,
    }

    // Get an access token from Nango
    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx)

    ctx.log.debug({ nangoId, accessToken, data: config.data }, 'Creating bulk contacts in HubSpot')

    config.headers.Authorization = `Bearer ${accessToken}`

    const result = await throttler.throttle(() => axios(config))

    // return hubspot ids back to sync worker for saving
    return result.data.results.reduce((acc, m) => {
      const member = members.find(
        (crowdMember) =>
          crowdMember.emails.length > 0 && crowdMember.emails[0] === m.properties.email,
      )
      acc.push({
        memberId: member.id,
        sourceId: m.id,
      })
      return acc
    }, [])
  } catch (err) {
    ctx.log.error({ err }, 'Error while batch create contacts to HubSpot')
    throw err
  }
}
