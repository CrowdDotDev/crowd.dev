/* eslint-disable @typescript-eslint/no-explicit-any */
import { IGenerateStreamsContext, IProcessStreamContext } from '@/types'
import axios, { AxiosRequestConfig } from 'axios'
import { getNangoToken } from './../../../nango'
import { IMember, PlatformType } from '@crowd/types'
import { RequestThrottler } from '@crowd/common'
import { HubspotMemberFieldMapper } from '../field-mapper/memberFieldMapper'

export const batchUpdateMembers = async (
  nangoId: string,
  members: IMember[],
  memberMapper: HubspotMemberFieldMapper,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  throttler: RequestThrottler,
): Promise<any> => {
  const config: AxiosRequestConfig<unknown> = {
    method: 'post',
    url: `https://api.hubapi.com/crm/v3/objects/contacts/batch/update`,
    data: {},
    headers: {
      Authorization: '',
    },
  }

  try {
    const hubspotMembers = []

    for (const member of members) {
      if (member) {
        const hubspotSourceId = member.attributes?.sourceId?.hubspot

        if (!hubspotSourceId) {
          ctx.log.warn(
            `Member ${member.id} can't be updated in hubspot! Member doesn't have a hubspot sourceId in attributes.`,
          )
        } else {
          const hsMember = {
            id: hubspotSourceId,
            properties: {},
          } as any

          const fields = memberMapper.getAllCrowdFields()

          for (const crowdField of fields) {
            const hubspotField = memberMapper.getHubspotFieldName(crowdField)
            // if hubspot e-mail field is mapped to a crowd field, we should ignore it because
            // we handle this manually above
            if (hubspotField && hubspotField !== 'email') {
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

                const identityFound = member.identities.find((i) => i.platform === identityPlatform)

                if (identityPlatform && hubspotField && identityFound) {
                  hsMember.properties[hubspotField] = identityFound.username
                }
              } else if (crowdField === 'organizationName') {
                // send latest org of member as value
              } else if (hubspotField && member[crowdField] !== undefined) {
                hsMember.properties[hubspotField] = memberMapper.getHubspotValue(member, crowdField)
              }
            }
          }

          if (Object.keys(hsMember.properties).length > 0) {
            hubspotMembers.push(hsMember)
          }
        }
      }
    }

    config.data = {
      inputs: hubspotMembers,
    }

    // Get an access token from Nango
    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx, throttler)

    ctx.log.debug({ nangoId, accessToken, data: config.data }, 'Updating bulk contacts in HubSpot')

    config.headers.Authorization = `Bearer ${accessToken}`

    const result = await throttler.throttle(() => axios(config))

    return result.data?.results || []
  } catch (err) {
    ctx.log.error({ err }, 'Error while batch update contacts to HubSpot')
    throw err
  }
}
