import axios, { AxiosRequestConfig } from 'axios'
import { PlatformType } from '@crowd/types'
import { getNangoToken } from '../../../nango'
import { IGenerateStreamsContext, IProcessStreamContext } from '../../../../types'
import { IHubspotTokenInfo } from '../types'

export const getTokenInfo = async (
  nangoId: string,
  ctx: IProcessStreamContext | IGenerateStreamsContext,
): Promise<IHubspotTokenInfo> => {
  try {
    ctx.log.debug({ nangoId }, 'Fetching custom properties from HubSpot')

    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx)

    const config: AxiosRequestConfig<unknown> = {
      method: 'get',
      url: `https://api.hubapi.com/oauth/v1/access-tokens/${accessToken}`,
    }

    const response: IHubspotTokenInfo = (await axios(config)).data

    return response
  } catch (err) {
    ctx.log.error({ err }, 'Error while getting hubspot token information!')
    throw err
  }
}
