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

export const obfuscate = (email: string): string => {
  // make email all lowercase
  email = email.toLowerCase()
  const obfuscatedArray: string[] = []

  for (let i = 0; i < email.length; i++) {
    const char = email[i]

    // Check if the character is a '.' or '@'
    if (char === '.' || char === '@') {
      obfuscatedArray.push(char)
    } else {
      // Get the character code of the current character
      const charCode = char.charCodeAt(0)

      // Calculate the new character code by adding 1 and using modulus 256 for overflow
      // 256 is chosen because char codes range from 0 to 255 in the ASCII table
      const newCharCode = (charCode + 1) % 256

      // Convert the new character code back to a string and add it to the array
      obfuscatedArray.push(String.fromCharCode(newCharCode))
    }
  }

  // Join the array into a single string and return it
  return obfuscatedArray.join('')
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
