/**
 * Platform registry / discovery.
 *
 * All supported platforms are registered here, keyed by PlatformType.
 * Only those listed in CROWD_SNOWFLAKE_ENABLED_PLATFORMS (comma-separated) are active.
 */

import { PlatformType } from '@crowd/types'

import { TransformerBase } from '../core/transformerBase'
import { CventTransformer } from './cvent/transformer'
import { buildSourceQuery as cventBuildSourceQuery } from './cvent/buildSourceQuery'

export type BuildSourceQuery = (sinceTimestamp?: string) => string

export interface PlatformDefinition {
  transformer: TransformerBase
  buildSourceQuery: BuildSourceQuery
}

const supported: Partial<Record<PlatformType, PlatformDefinition>> = {
  [PlatformType.CVENT]: { transformer: new CventTransformer(), buildSourceQuery: cventBuildSourceQuery },
}

const enabled = (process.env.CROWD_SNOWFLAKE_ENABLED_PLATFORMS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean) as PlatformType[]

export function getPlatform(platform: PlatformType): PlatformDefinition {
  if (!supported[platform]) {
    throw new Error(`Unsupported platform: ${platform}`)
  }
  if (!enabled.includes(platform)) {
    throw new Error(`Platform not enabled: ${platform} (enabled: ${enabled.join(', ')})`)
  }
  return supported[platform]
}

export function getEnabledPlatformDefinitions(): PlatformDefinition[] {
  return enabled.map((platform) => {
    if (!supported[platform]) {
      throw new Error(`Enabled platform not supported: ${platform}`)
    }
    return supported[platform]
  })
}

export function getEnabledPlatforms(): PlatformType[] {
  return enabled
}
