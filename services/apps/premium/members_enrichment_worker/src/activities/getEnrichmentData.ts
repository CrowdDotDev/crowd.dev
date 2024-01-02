import axios from 'axios'

import { PlatformType } from '@crowd/types'
import { EnrichmentAPIResponse, EnrichmentAPIMember } from '@crowd/types/premium'

import { EnrichingMember } from '../types/enrichment'

/*
enrichMemberUsingGitHubHandle is a Temporal activity that fetches enrichment data
from external API using the member's GitHub username.
*/
export async function enrichMemberUsingGitHubHandle(
  input: EnrichingMember,
): Promise<EnrichmentAPIMember> {
  const url = `${process.env['CROWD_ENRICHMENT_URL']}/get_profile`

  let response: EnrichmentAPIResponse = null
  try {
    response = (
      await axios<EnrichmentAPIResponse>({
        method: 'get',
        url,
        params: {
          github_handle: input.member.username[PlatformType.GITHUB],
          with_emails: true,
          api_key: process.env['CROWD_ENRICHMENT_API_KEY'],
        },
        headers: {},
      })
    ).data
  } catch (err) {
    throw new Error(err)
  }

  if (!response.profile) {
    return null
  }

  return response.profile
}

/*
enrichMemberUsingEmailAddress is a Temporal activity that fetches enrichment data
from external API using the member's email address.
*/
export async function enrichMemberUsingEmailAddress(
  input: EnrichingMember,
): Promise<EnrichmentAPIMember> {
  const url = `${process.env['CROWD_ENRICHMENT_URL']}/get_profile`

  let response: EnrichmentAPIResponse = null
  try {
    response = (
      await axios<EnrichmentAPIResponse>({
        method: 'get',
        url,
        params: {
          email: input.member.emails[0],
          with_emails: true,
          api_key: process.env['CROWD_ENRICHMENT_API_KEY'],
        },
        headers: {},
      })
    ).data
  } catch (err) {
    throw new Error(err)
  }

  if (!response.profile) {
    return null
  }

  return response.profile
}
