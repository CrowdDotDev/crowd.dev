import type { MemberContributorCollectionPath } from '@crowd/data-access-layer'

export const MEMBER_CONTRIBUTOR_COLLECTION_PATHS: Record<string, MemberContributorCollectionPath> =
  {
    npm: 'github',
    maven: 'github',
    pypi: 'github',
    cargo: 'github',
    go: 'github',
    nuget: 'github',
    packagist: 'github',
    rubygems: 'github',
  }

export function purlEcosystem(purl: string): string {
  const afterScheme = purl.slice('pkg:'.length)
  const slash = afterScheme.indexOf('/')
  const type = slash === -1 ? afterScheme : afterScheme.slice(0, slash)
  return type.toLowerCase()
}

export function collectionPathForEcosystem(
  ecosystem: string,
): MemberContributorCollectionPath | null {
  return Object.hasOwn(MEMBER_CONTRIBUTOR_COLLECTION_PATHS, ecosystem)
    ? MEMBER_CONTRIBUTOR_COLLECTION_PATHS[ecosystem]
    : null
}
