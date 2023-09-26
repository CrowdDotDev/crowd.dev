import axios, { AxiosRequestConfig } from 'axios'
import { PlatformType } from '@crowd/types'
import { getNangoToken } from '../../../nango'
import { IGenerateStreamsContext, IProcessStreamContext } from '@/types'
import { RequestThrottler } from '@crowd/common'

export const addContactsToList = async (
  nangoId: string,
  listId: string,
  contactIds: string[],
  ctx: IProcessStreamContext | IGenerateStreamsContext,
  throttler: RequestThrottler,
): Promise<void> => {
  const config: AxiosRequestConfig<unknown> = {
    method: 'post',
    url: `https://api.hubapi.com/contacts/v1/lists/${listId}/add`,
    data: {},
  }
  try {
    ctx.log.debug({ nangoId }, `Adding contacts to list ${listId} in HubSpot!`)

    const accessToken = await getNangoToken(nangoId, PlatformType.HUBSPOT, ctx, throttler)
    config.headers = { Authorization: `Bearer ${accessToken}` }

    config.data = {
      vids: contactIds,
    }

    await throttler.throttle(() => axios(config))
  } catch (err) {
    ctx.log.error({ err }, `Error while adding contacts to hubspot list!`)
    throw err
  }
}
