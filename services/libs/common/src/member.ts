export async function setAttributesDefaultValues(
  attributes: Record<string, unknown>,
  priorities: string[],
): Promise<Record<string, unknown>> {
  if (!priorities) {
    throw new Error(`No priorities set!`)
  }

  for (const attributeName of Object.keys(attributes)) {
    if (typeof attributes[attributeName] === 'string') {
      // we try to fix it
      try {
        attributes[attributeName] = JSON.parse(attributes[attributeName] as string)
      } catch (err) {
        this.log.error(err, { attributeName }, 'Could not parse a string attribute value!')
        throw err
      }
    }
    const highestPriorityPlatform = getHighestPriorityPlatformForAttributes(
      Object.keys(attributes[attributeName]),
      priorities,
    )

    if (highestPriorityPlatform !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(attributes[attributeName] as any).default =
        attributes[attributeName][highestPriorityPlatform]
    } else {
      delete attributes[attributeName]
    }
  }

  return attributes
}

export function getHighestPriorityPlatformForAttributes(
  platforms: string[],
  priorityArray: string[],
): string | undefined {
  if (platforms.length <= 0) {
    return undefined
  }
  const filteredPlatforms = priorityArray.filter((i) => platforms.includes(i))
  return filteredPlatforms.length > 0 ? filteredPlatforms[0] : platforms[0]
}
