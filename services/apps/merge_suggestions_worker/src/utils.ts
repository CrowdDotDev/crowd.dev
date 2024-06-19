import { ILLMConsumableMember } from '@crowd/types'

export const prefixLength = (string: string) => {
  if (string.length > 5 && string.length < 8) {
    return 6
  }

  return 10
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}

export const removeEmailLikeIdentitiesFromMember = (
  member: ILLMConsumableMember,
): ILLMConsumableMember => {
  const nonEmailIdentities: { platform: string; value: string }[] = []
  for (const identity of member.identities) {
    if (identity.value.indexOf('@') === -1) {
      // remove found identity from member.identities
      nonEmailIdentities.push(identity)
    }
  }

  member.identities = nonEmailIdentities

  return member
}
