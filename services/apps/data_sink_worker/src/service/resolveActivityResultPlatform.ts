import { PlatformType } from '@crowd/types'

// Octolens emits activities across many real platforms from one integration, so the
// activity's own platform must win — every other integration today only ever has one.
export function resolveActivityResultPlatform(
  integrationPlatform: PlatformType | null,
  activityPlatform: PlatformType | undefined,
): PlatformType {
  const platform = activityPlatform ?? integrationPlatform
  return platform === PlatformType.GITHUB_NANGO ? PlatformType.GITHUB : platform
}
