/* eslint-disable @typescript-eslint/no-unused-vars */

export const keepPrimary = (primary: any, secondary: any): any => primary

export const keepPrimaryIfExists = (primary: any, secondary: any): any => {
  if (typeof primary === 'object') {
    if (
      (Array.isArray(primary) && primary.length > 0) ||
      (!Array.isArray(primary) && primary && Object.keys(primary).length > 0)
    ) {
      return primary
    }
  } else if (primary) {
    return primary
  }

  return secondary
}

export const mergeUniqueStringArrayItems = (primary: string[], secondary: string[]): string[] => {
  if (!primary || primary.length === 0) {
    return secondary
  }

  if (!secondary || secondary.length === 0) {
    return primary
  }

  return [...new Set([...primary, ...secondary])]
}
