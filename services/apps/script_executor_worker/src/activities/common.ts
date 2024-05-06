export async function mergeMembers(
  primaryMemberId: string,
  secondaryMemberId: string,
  tenantId: string,
): Promise<void> {
  const url = `${process.env['CROWD_API_SERVICE_URL']}/tenant/${tenantId}/member/${primaryMemberId}/merge`
  console.log(url)
  const requestOptions = {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${process.env['CROWD_API_SERVICE_USER_TOKEN']}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      memberToMerge: secondaryMemberId,
    }),
  }

  console.log(requestOptions)

  const res = await fetch(url, requestOptions)

  console.log('Result: ')
  console.log(res)

  if (res.status !== 200) {
    throw new Error(`Failed to merge member ${primaryMemberId} with ${secondaryMemberId}!`)
  }
}
