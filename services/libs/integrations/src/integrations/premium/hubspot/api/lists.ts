import axios, { AxiosRequestConfig } from 'axios'
import { PlatformType } from '@crowd/types'
import { getNangoToken } from '../../../nango'
import { IGenerateStreamsContext, IProcessStreamContext } from '@/types'
import { IHubspotList } from '../types'

export const getLists = async (
  nangoId: string,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
): Promise<IHubspotList[]> => {
  const PAGE_SIZE = 100
  const config: AxiosRequestConfig<unknown> = {
    method: 'get',
    url: `https://api.hubapi.com/contacts/v1/lists`,
  }
  try {
    ctx.log.debug({ nangoId }, `Fetching lists from HubSpot`)

    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx)
    config.headers = { Authorization: `Bearer ${accessToken}` }

    let response
    let offset
    const hubspotLists: IHubspotList[] = []

    do {
      offset = response === undefined ? 0 : response.offset
      config.url = `https://api.hubapi.com/contacts/v1/lists?count=${PAGE_SIZE}&offset=${offset}`

      ctx.log.debug({ PAGE_SIZE, offset, url: config.url }, `Getting lists!`)

      response = (await axios(config)).data

      hubspotLists.push(...response.lists.filter((l) => l.dynamic !== true))
    } while (response[`has-more`] !== false)

    return hubspotLists
  } catch (err) {
    ctx.log.error({ err }, `Error while getting hubspot lists!`)
    throw err
  }
}
