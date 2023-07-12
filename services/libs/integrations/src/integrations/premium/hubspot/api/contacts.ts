import { IGenerateStreamsContext, IProcessStreamContext } from '@/types'
import { IHubspotContact } from '../types'
import axios, { AxiosRequestConfig } from 'axios'
import { HubspotFieldMapper } from '../hubspotFieldMapper'
import { getNangoToken } from './../../../nango'
import { PlatformType } from '@crowd/types'
import { IPaginatedResponse } from './types'

export const getContacts = async (
  nangoId: string,
  mapper: HubspotFieldMapper,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  after?: string,
): Promise<IPaginatedResponse<IHubspotContact[]>> => {
  const config: AxiosRequestConfig<unknown> = {
    method: 'get',
    url: `https://api.hubapi.com/crm/v3/objects/contacts`,
    params: {
      limit: 1,
      properties: `email,${mapper.getAllHubspotMemberFields().join(',')}`,
    },
    headers: {
      Authorization: '',
    },
  }

  try {
    ctx.log.debug({ nangoId }, 'Fetching contacts from HubSpot')

    // Get an access token from Nango
    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx)

    ctx.log.debug({ accessToken }, `nango token`)
    config.headers.Authorization = `Bearer ${accessToken}`

    // set pagination
    config.params.after = after

    const result = await axios(config)

    const elements = result.data.results

    if (result.data.paging?.next?.after) {
      return {
        elements,
        after: result.data.paging.next.after,
      }
    }

    return {
      elements,
    }
  } catch (err) {
    ctx.log.error({ err }, 'Error while fetching contacts from HubSpot')
    throw err
  }
}

export const getAllContacts = async (
  nangoId: string,
  mapper: HubspotFieldMapper,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
): Promise<IHubspotContact[]> => {
  const elements = []

  let response = await getContacts(nangoId, mapper, ctx)
  elements.push(...response.elements)
  while (response.after !== undefined) {
    response = await getContacts(nangoId, mapper, ctx, response.after)
    elements.push(...response.elements)
  }

  return elements
}
