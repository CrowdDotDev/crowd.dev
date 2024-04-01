import axios from 'axios'

import { EnrichmentAPIResponse, EnrichmentAPIMember } from '@crowd/types/src/premium'

/*
enrichMemberUsingGitHubHandle is a Temporal activity that fetches enrichment data
from external API using the member's GitHub username.
*/
export async function enrichMemberUsingGitHubHandle(
  githubUsername: string,
): Promise<EnrichmentAPIMember> {
  let response: EnrichmentAPIResponse

  try {
    const url = `${process.env['CROWD_ENRICHMENT_URL']}/get_profile`
    const config = {
      method: 'get',
      url,
      params: {
        github_handle: githubUsername,
        with_emails: true,
        api_key: process.env['CROWD_ENRICHMENT_API_KEY'],
      },
      headers: {},
    }

    response = (await axios(config)).data
  } catch (err) {
    throw new Error(err)
  }

  return response.profile
}

/*
enrichMemberUsingEmailAddress is a Temporal activity that fetches enrichment data
from external API using the member's email address.
*/
export async function enrichMemberUsingEmailAddress(email: string): Promise<EnrichmentAPIMember> {
  try {
    const url = `${process.env['CROWD_ENRICHMENT_URL']}/get_profile`
    const config = {
      method: 'get',
      url,
      params: {
        email,
        with_emails: true,
        api_key: process.env['CROWD_ENRICHMENT_API_KEY'],
      },
      headers: {},
    }

    const response = (await axios(config)).data
    return response.profile
  } catch (err) {
    throw new Error(err)
  }
}
