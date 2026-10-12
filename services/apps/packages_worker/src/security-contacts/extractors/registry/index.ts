import { Extractor, ExtractorResult, RawContact, RepoPackage, RepoPolicies } from '../../types'
import { fetchCargo } from './cargo'
import { fetchComposer } from './composer'
import { fetchGo } from './go'
import { fetchMaven } from './maven'
import { fetchNpm } from './npm'
import { fetchNuget } from './nuget'
import { ParsedPurl, parsePurl } from './purl'
import { fetchPypi } from './pypi'
import { fetchRubygems } from './rubygems'

type EcosystemFetcher = (
  parsed: ParsedPurl,
  timeoutMs: number,
  userAgent: string,
  repoUrl?: string,
) => Promise<ExtractorResult>

// Keyed by the lowercased packages.ecosystem value. Composer packages live under
// 'packagist' — the value the packagist worker seeds — not 'composer', which no
// writer ever produces (the original entry predated the worker and guessed wrong).
export const FETCHERS: Record<string, EcosystemFetcher> = {
  npm: fetchNpm,
  pypi: fetchPypi,
  maven: fetchMaven,
  cargo: fetchCargo,
  nuget: fetchNuget,
  rubygems: fetchRubygems,
  packagist: fetchComposer,
  go: fetchGo,
}

// Sibling artifacts in one maven group share a parent POM and developer list, while repos like
// open-liberty publish 1k+ critical artifacts per group — fetching all of them stalls the batch.
export const MAX_MAVEN_ARTIFACTS_PER_GROUP = 10

export function selectPackagesToFetch(packages: RepoPackage[]): RepoPackage[] {
  const selected: RepoPackage[] = []
  const seenPurls = new Set<string>()
  const mavenArtifactsPerGroup = new Map<string, number>()

  for (const pkg of packages) {
    if (seenPurls.has(pkg.purl)) continue
    seenPurls.add(pkg.purl)

    const group = pkg.ecosystem?.toLowerCase() === 'maven' ? parsePurl(pkg.purl)?.namespace : null
    if (group) {
      const count = mavenArtifactsPerGroup.get(group) ?? 0
      if (count >= MAX_MAVEN_ARTIFACTS_PER_GROUP) continue
      mavenArtifactsPerGroup.set(group, count + 1)
    }
    selected.push(pkg)
  }

  return selected
}

export const extractManifest: Extractor = async (target, deps) => {
  const contacts: RawContact[] = []
  const policies: Partial<RepoPolicies> = {}
  const candidatesByHandle = new Map<string, RawContact>()

  for (const pkg of selectPackagesToFetch(target.packages)) {
    const fetcher = FETCHERS[pkg.ecosystem?.toLowerCase()]
    if (!fetcher) continue

    const parsed = parsePurl(pkg.purl)
    if (!parsed) continue

    try {
      const result = await fetcher(parsed, deps.fetchTimeoutMs, deps.userAgent, target.url)
      contacts.push(...result.contacts)
      for (const candidate of result.handleCandidates ?? []) {
        const key = candidate.value.toLowerCase()
        const existing = candidatesByHandle.get(key)
        if (existing) {
          existing.provenance.push(...candidate.provenance)
        } else {
          candidatesByHandle.set(key, { ...candidate, provenance: [...candidate.provenance] })
        }
      }
      for (const [key, value] of Object.entries(result.policies)) {
        if (!(policies as Record<string, unknown>)[key] && value != null) {
          ;(policies as Record<string, unknown>)[key] = value
        }
      }
    } catch {
      // one bad package must not sink the rest
      continue
    }
  }

  return { contacts, policies, handleCandidates: [...candidatesByHandle.values()] }
}
