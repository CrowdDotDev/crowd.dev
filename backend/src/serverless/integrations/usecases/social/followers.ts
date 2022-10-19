import { SuperfaceClient } from '@superfaceai/one-sdk'
import { SocialResponse } from '../../types/superfaceTypes'
import BaseIterator from '../../iterators/baseIterator'
import isInvalid from '../isInvalid'
import { PlatformType } from '../../../../types/integrationEnums'
/**
 * Get all followers of an account
 * @param accessToken User token to access the Twitter API
 * @param profileId Profile to get followers for
 * @param page For API pagination
 * @returns Sueprface result with the posts and rate limiting information
 */
const getFollowers = async (
  client: SuperfaceClient,
  accessToken: string,
  profileId: string,
  page: string | undefined = '',
): Promise<SocialResponse> => {
  const provider = await client.getProvider(PlatformType.TWITTER)
  const profile = await client.getProfile('social-media/followers')

  page = page || undefined
  const inputs = { profileId, page }
  const result: any = await profile.getUseCase('GetFollowers').perform(inputs, {
    provider,
    parameters: {
      accessToken,
    },
  })
  if (isInvalid(result, 'followers')) {
    console.log('Invalid request in followers')
    console.log('Inputs: ', inputs)
    console.log('Result: ', result)
  }
  return {
    records: result.value.followers,
    nextPage: result.value.nextPage,
    limit: result.value.rateLimit.remainingRequests,
    timeUntilReset: BaseIterator.secondsUntilTimestamp(result.value.rateLimit.resetTimestamp),
  }
}

export default getFollowers
