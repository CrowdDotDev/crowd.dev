import type { IClaimedUnit } from '@crowd/data-access-layer/src/connectors'

const CHANNEL_LABEL_MAX_LENGTH = 80

function channelLabel(channelName: string): string {
  const label = channelName
    .replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]+\//i, '')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\s+/g, '-')
    .slice(0, CHANNEL_LABEL_MAX_LENGTH)

  return label || 'unknown-channel'
}

export function syncRunWorkflowId(
  unit: Pick<IClaimedUnit, 'id' | 'platform' | 'syncName' | 'channelName'>,
): string {
  return `sync-run/${unit.platform}/${unit.syncName}/${channelLabel(unit.channelName)}/${unit.id}`
}
