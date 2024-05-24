import { IMemberUnmergeBackup, IUnmergeBackup } from '@crowd/types'
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
    await axios(url, requestOptions)
  } catch (error) {
    console.log(`Failed merging member wit status [${error.response.status}]. Skipping!`)
  }
}

export async function unmergeMembers(
  primaryMemberId: string,
  backup: IUnmergeBackup<IMemberUnmergeBackup>,
  tenantId: string,
): Promise<void> {
  const url = `${process.env['CROWD_API_SERVICE_URL']}/tenant/${tenantId}/member/${primaryMemberId}/unmerge`
  const requestOptions = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env['CROWD_API_SERVICE_USER_TOKEN']}`,
      'Content-Type': 'application/json',
    },
    data: {
      ...backup,
    },
  }

  try {
    await axios(url, requestOptions)
  } catch (error) {
    console.log(`Failed unmerging member with status [${error.response.status}]. Skipping!`)
  }
}
