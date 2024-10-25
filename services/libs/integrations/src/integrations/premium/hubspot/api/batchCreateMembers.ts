/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosRequestConfig } from 'axios'

import { RequestThrottler } from '@crowd/common'
import { IMember, MemberIdentityType, PlatformType } from '@crowd/types'

import { IGenerateStreamsContext, IProcessStreamContext } from '../../../../types'
import { HubspotMemberFieldMapper } from '../field-mapper/memberFieldMapper'

import { getNangoToken } from './../../../nango'
import { batchUpdateMembers } from './batchUpdateMembers'
import { getContactById } from './contactById'
import { IBatchCreateMembersResult } from './types'

export const batchCreateMembers = async (
  nangoId: string,
  members: IMember[],
  memberMapper: HubspotMemberFieldMapper,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  throttler: RequestThrottler,
): Promise<IBatchCreateMembersResult[]> => {
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
      const primaryEmail =
        member.identities.filter((i) => i.type === MemberIdentityType.EMAIL && i.verified).length >
        0
          ? member.identities.find((i) => i.type === MemberIdentityType.EMAIL && i.verified)?.value
          : null

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

              const identityFound = member.identities.find(
                (i) => i.platform === identityPlatform && i.type === MemberIdentityType.USERNAME,
              )

              if (identityPlatform && hubspotField && identityFound) {
                hsMember.properties[hubspotField] = identityFound.value
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

    config.data = {
      inputs: hubspotMembers,
    }

    // Get an access token from Nango
    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx, throttler)

    ctx.log.debug({ nangoId, accessToken, data: config.data }, 'Creating bulk contacts in HubSpot')

    config.headers.Authorization = `Bearer ${accessToken}`

    const result = await throttler.throttle(() => axios(config))

    // return hubspot ids back to sync worker for saving
    return result.data.results.reduce((acc, m) => {
      const member = members.find(
        (crowdMember) =>
          crowdMember.identities.filter((i) => i.type === MemberIdentityType.EMAIL && i.verified)
            .length > 0 &&
          crowdMember.identities
            .filter((i) => i.type === MemberIdentityType.EMAIL && i.verified)
            .map((i) => i.value)
            .includes(m.properties.email),
      )

      const hubspotPayload = hubspotMembers.find(
        (hubspotMember) => hubspotMember.properties.email === m.properties.email,
      )

      acc.push({
        memberId: member.id,
        sourceId: m.id,
        lastSyncedPayload: hubspotPayload,
      })
      return acc
    }, [])
  } catch (err) {
    // this means that member actually exists in hubspot but we tried re-creating it
    // handle it gracefully
    if (err.response?.data?.category === 'CONFLICT') {
      ctx.log.info(
        { err },
        'Conflict while batch create contacts in HubSpot. Trying to resolve the conflicts.',
      )
      const match = err.response?.data?.message.match(/ID: (\d+)/)
      const id = match ? match[1] : null
      if (id) {
        const member = await getContactById(nangoId, id, memberMapper, ctx, throttler)

        if (member) {
          // exclude found member from batch payload
          const createMembers = members.filter(
            (m) =>
              !m.identities
                .filter((i) => i.type === MemberIdentityType.EMAIL && i.verified)
                .map((i) => i.value.toLowerCase())
                .includes((member.properties as any).email.toLowerCase()),
          )

          const updateMembers = members
            .filter((m) =>
              m.identities
                .filter((i) => i.type === MemberIdentityType.EMAIL && i.verified)
                .map((i) => i.value.toLowerCase())
                .includes((member.properties as any).email.toLowerCase()),
            )
            .map((m) => {
              m.attributes = {
                ...m.attributes,
                sourceId: {
                  hubspot: id,
                },
              }
              return m
            })

          await batchUpdateMembers(nangoId, updateMembers, memberMapper, ctx, throttler)
          return await batchCreateMembers(nangoId, createMembers, memberMapper, ctx, throttler)
        }
      }
    } else {
      ctx.log.error({ err }, 'Error while batch create contacts to HubSpot')
      throw err
    }
  }
}
