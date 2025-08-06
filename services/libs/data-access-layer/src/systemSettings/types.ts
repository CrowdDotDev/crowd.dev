export type SystemSettingTypes = {
  memberDisplayAggsLastSyncedAt: { timestamp: string }
  organizationDisplayAggsLastSyncedAt: { timestamp: string }
  enrichmentRateLimitReset: { [source: string]: { timestamp: string } }
}

export type SystemSettingKey = keyof SystemSettingTypes
