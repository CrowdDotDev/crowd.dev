import axios from 'axios'

export async function mergeMembers(
  primaryMemberId: string,
  secondaryMemberId: string,
  tenantId: string,
): Promise<void> {
  const url = `${process.env['CROWD_API_SERVICE_URL']}/tenant/${tenantId}/member/${primaryMemberId}/merge`
  const requestOptions = {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env['CROWD_API_SERVICE_USER_TOKEN']}`,
      'Content-Type': 'application/json',
    },
    data: {
      memberToMerge: secondaryMemberId,
    },
  }

  try {
    const response = await axios(url, requestOptions)

    // Axios throws an error for bad status codes, so this check is technically redundant
    if (response.status === 404) {
      console.log('Failed finding member while merging. Skipping!')
    } else if (response.status === 500) {
      throw new Error(`Failed to merge member ${primaryMemberId} with ${secondaryMemberId}!`)
    }
  } catch (error) {
    console.log(error)
    console.error('Error during member merge:', error.message)
    if (error.status === 404) {
      console.log('Failed finding member while merging. Skipping!')
    } else {
      throw new Error(
        `Failed to merge member ${primaryMemberId} with ${secondaryMemberId}! Error: ${error.message}`,
      )
    }
  }
}
