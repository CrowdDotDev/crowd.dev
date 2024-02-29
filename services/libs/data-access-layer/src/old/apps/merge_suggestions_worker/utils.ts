import { IMemberMergeSuggestion } from '@crowd/types'

export function removeDuplicateSuggestions(
  suggestions: IMemberMergeSuggestion[],
): IMemberMergeSuggestion[] {
  const seen = new Set<string>()

  return suggestions.filter((suggestion) => {
    // Sort members and convert them to string for comparison
    const membersString = suggestion.members.slice().sort().join()

    if (seen.has(membersString)) {
      // We have seen this pair of members before, filter it out
      return false
    } else {
      // This is a new pair of members, add it to the set
      seen.add(membersString)
      return true
    }
  })
}

export function chunkArray<T>(array: T[], chunkSize: number): T[][] {
  const chunks = []
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize))
  }
  return chunks
}
