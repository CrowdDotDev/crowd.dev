import { SuggestionType } from '@crowd/types'

export function removeDuplicateSuggestions<T>(suggestions: T[], type: SuggestionType): T[] {
  const seen = new Set<string>()

  return suggestions.filter((suggestion) => {
    // Sort and convert suggestions to string for comparison
    const suggestionString = suggestion[type].slice().sort().join()

    if (seen.has(suggestionString)) {
      // We have seen this pair of members before, filter it out
      return false
    } else {
      // This is a new pair of members, add it to the set
      seen.add(suggestionString)
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
