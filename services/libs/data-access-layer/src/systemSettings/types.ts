export type SystemSettingTypes = {
  memberDisplayAggsLastSyncedAt: { timestamp: string }
  organizationDisplayAggsLastSyncedAt: { timestamp: string }
}

export type SystemSettingKey = keyof SystemSettingTypes
