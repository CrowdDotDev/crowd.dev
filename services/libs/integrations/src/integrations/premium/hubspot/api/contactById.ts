import { IGenerateStreamsContext, IProcessStreamContext } from '@/types'
import { IHubspotObject } from '../types'
import axios, { AxiosRequestConfig } from 'axios'
import { getNangoToken } from './../../../nango'
import { PlatformType } from '@crowd/types'
import { RequestThrottler } from '@crowd/common'
import { HubspotMemberFieldMapper } from '../field-mapper/memberFieldMapper'

export const getContactById = async (
  nangoId: string,
  contactId: string,
  memberMapper: HubspotMemberFieldMapper,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  throttler: RequestThrottler,
): Promise<IHubspotObject> => {
  const config: AxiosRequestConfig<unknown> = {
    method: 'get',
    url: `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}`,
    params: {
      limit: 1,
      properties: `email,${memberMapper.getAllHubspotFields().join(',')}`,
    },
    headers: {
      Authorization: '',
    },
  }

  try {
    ctx.log.debug({ nangoId, contactId }, 'Fetching contact by id from HubSpot')

    // Get an access token from Nango
    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx, throttler)

    ctx.log.debug({ accessToken }, `nango token`)
    config.headers.Authorization = `Bearer ${accessToken}`

    const result = await throttler.throttle(() => axios(config))

    const element = result.data

    if (!element) {
      return null
    }

    return element
  } catch (err) {
    ctx.log.error({ err }, 'Error while fetching contacts from HubSpot')
    throw err
  }
}
