/* eslint-disable @typescript-eslint/no-unused-vars */
import lodash from 'lodash'

import { findAttribute } from '@crowd/data-access-layer/src/organizations/attributesConfig'

type AttributeValuesBySource = { default?: string; [source: string]: string[] | string | undefined }

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

export const keepPrimaryAttributes = (
  primary: Record<string, AttributeValuesBySource>,
  merged: Record<string, AttributeValuesBySource>,
  primaryColumns: Record<string, unknown>,
): Record<string, AttributeValuesBySource> =>
  lodash.transform(
    merged,
    (result, values, name) => {
      const { incomingType, defaultColumn } = findAttribute(name)
      const primaryValues = primary?.[name]

      if (incomingType === 'string_array') {
        result[name] = primaryValues ? { ...values, default: primaryValues.default } : values
      } else if (primaryValues) {
        result[name] = primaryValues
      } else if (!defaultColumn || lodash.isNil(primaryColumns[defaultColumn])) {
        result[name] = values
      }
    },
    {},
  )
