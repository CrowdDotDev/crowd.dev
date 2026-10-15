import type { AnyManifest, Manifest, SyncDefinition } from './types'

const manifests = new Map<string, AnyManifest>()

export function registerConnector<TDeps>(manifest: Manifest<TDeps>): void {
  manifests.set(manifest.platform, manifest)
}

export function findManifest(platform: string): AnyManifest | undefined {
  return manifests.get(platform)
}

export function getManifest(platform: string): AnyManifest {
  const manifest = manifests.get(platform)
  if (!manifest) {
    throw new Error(`unknown platform ${platform}`)
  }
  return manifest
}

export function findSync(platform: string, syncName: string): SyncDefinition<unknown> | undefined {
  return findManifest(platform)?.syncs.find((s) => s.name === syncName)
}

export function getSync(platform: string, syncName: string): SyncDefinition<unknown> {
  const sync = getManifest(platform).syncs.find((s) => s.name === syncName)
  if (!sync) {
    throw new Error(`unknown sync ${platform}/${syncName}`)
  }
  return sync
}
