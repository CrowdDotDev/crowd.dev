import axios, { AxiosResponse } from 'axios'

import { PlatformType } from '@crowd/types'
import { EnrichmentAPIResponse, EnrichmentAPIMember } from '@crowd/types/src/premium'

import { EnrichingMember } from '../types/enrichment'

/*
enrichMemberUsingGitHubHandle is a Temporal activity that fetches enrichment data
from external API using the member's GitHub username.
*/
export async function enrichMemberUsingGitHubHandle(
  input: EnrichingMember,
): Promise<EnrichmentAPIMember> {
  const url = `${process.env['CROWD_ENRICHMENT_URL']}/get_profile`

  let response: AxiosResponse<EnrichmentAPIResponse> = null
  try {
    response = await axios({
      method: 'get',
      url,
      params: {
        github_handle: input.member.username[PlatformType.GITHUB],
        with_emails: true,
        api_key: process.env['CROWD_ENRICHMENT_API_KEY'],
      },
      headers: {},
    })
  } catch (err) {
    if (!response || response.status === 500) {
      return null
    }

    throw new Error(err)
  }

  if (!response.data.profile) {
    return null
  }

  return response.data.profile
}

/*
enrichMemberUsingEmailAddress is a Temporal activity that fetches enrichment data
from external API using the member's email address.
*/
export async function enrichMemberUsingEmailAddress(
  input: EnrichingMember,
): Promise<EnrichmentAPIMember> {
  const url = `${process.env['CROWD_ENRICHMENT_URL']}/get_profile`

  let response: AxiosResponse<EnrichmentAPIResponse> = null
  try {
    response = await axios({
      method: 'get',
      url,
      params: {
        email: input.member.emails[0],
        with_emails: true,
        api_key: process.env['CROWD_ENRICHMENT_API_KEY'],
      },
      headers: {},
    })
  } catch (err) {
    if (!response || response.status === 500) {
      return null
    }

    throw new Error(err)
  }

  if (!response.data.profile) {
    return null
  }

  return response.data.profile
}
