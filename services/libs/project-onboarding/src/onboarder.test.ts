import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildGithubIntegrationPayload,
  buildGithubOrgSettings,
  connectRepoToSegment,
  connectReposToSegment,
  deriveProjectNameCandidates,
  mergeGithubOrgSettings,
  readErrorBody,
  resolveProjectSegment,
} from './onboarder'
import { IGithubOrgSettings } from './types'

interface IFakeSegment {
  name: string
  id: string
  connectedRepoUrls?: string[]
}

interface IFakeBackend {
  segmentsByName: Map<string, string>
  connectedRepoUrlsBySegment: Map<string, string[]>
  createdNames: string[]
}

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body))
}

function installFakeBackend(existing: IFakeSegment[]): IFakeBackend {
  const backend: IFakeBackend = {
    segmentsByName: new Map(existing.map(({ name, id }) => [name.toLowerCase(), id])),
    connectedRepoUrlsBySegment: new Map(
      existing.flatMap(({ id, connectedRepoUrls }) =>
        connectedRepoUrls ? [[id, connectedRepoUrls] as [string, string[]]] : [],
      ),
    ),
    createdNames: [],
  }

  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: { body: string }) => {
      const body = JSON.parse(init.body)

      if (url.endsWith('/segment/project/query')) {
        const id = backend.segmentsByName.get(String(body.filter.name).toLowerCase())
        const subprojects = id ? [{ id, name: body.filter.name }] : []
        return jsonResponse({ rows: [{ subprojects }], count: subprojects.length })
      }

      if (url.endsWith('/integration/query')) {
        const repoUrls = backend.connectedRepoUrlsBySegment.get(body.segments[0])
        const rows = repoUrls
          ? [{ settings: { orgs: [{ repos: repoUrls.map((url) => ({ url })) }] } }]
          : []
        return jsonResponse({ rows, count: rows.length })
      }

      backend.createdNames.push(body.name)
      backend.segmentsByName.set(body.name.toLowerCase(), `created-${body.name}`)
      return jsonResponse({})
    }),
  )

  return backend
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('deriveProjectNameCandidates', () => {
  it('returns the repo name first and the owner-qualified name second', () => {
    expect(deriveProjectNameCandidates('ai-dynamo', 'dynamo')).toEqual([
      'Dynamo',
      'Ai Dynamo Dynamo',
    ])
  })
})

describe('resolveProjectSegment', () => {
  const candidates = ['Dynamo', 'Ai Dynamo Dynamo']
  const repoUrl = 'https://github.com/ai-dynamo/dynamo'
  const otherRepoUrl = 'https://github.com/DynamoDS/Dynamo'

  it('creates a segment with the repo name when no project uses it', async () => {
    const backend = installFakeBackend([])

    const segmentId = await resolveProjectSegment(
      candidates,
      'slug',
      repoUrl,
      'http://api',
      'token',
    )

    expect(backend.createdNames).toEqual(['Dynamo'])
    expect(segmentId).toBe('created-Dynamo')
  })

  it('reuses an existing segment with the same name when it has no GitHub integration', async () => {
    const backend = installFakeBackend([{ name: 'Dynamo', id: 'empty-segment' }])

    const segmentId = await resolveProjectSegment(
      candidates,
      'slug',
      repoUrl,
      'http://api',
      'token',
    )

    expect(segmentId).toBe('empty-segment')
    expect(backend.createdNames).toEqual([])
  })

  it('creates an owner-qualified segment when the repo name is used by a connected project', async () => {
    const backend = installFakeBackend([
      { name: 'Dynamo', id: 'dynamods-segment', connectedRepoUrls: [otherRepoUrl.toLowerCase()] },
    ])

    const segmentId = await resolveProjectSegment(
      candidates,
      'slug',
      repoUrl,
      'http://api',
      'token',
    )

    expect(backend.createdNames).toEqual(['Ai Dynamo Dynamo'])
    expect(segmentId).toBe('created-Ai Dynamo Dynamo')
  })

  it('reuses the owner-qualified segment on a retry when it has no GitHub integration', async () => {
    const backend = installFakeBackend([
      { name: 'Dynamo', id: 'dynamods-segment', connectedRepoUrls: [otherRepoUrl.toLowerCase()] },
      { name: 'Ai Dynamo Dynamo', id: 'qualified-segment' },
    ])

    const segmentId = await resolveProjectSegment(
      candidates,
      'slug',
      repoUrl,
      'http://api',
      'token',
    )

    expect(segmentId).toBe('qualified-segment')
    expect(backend.createdNames).toEqual([])
  })

  it('reuses the segment already connected to the requested repo on a retry', async () => {
    const backend = installFakeBackend([
      { name: 'Dynamo', id: 'dynamods-segment', connectedRepoUrls: [otherRepoUrl.toLowerCase()] },
      { name: 'Ai Dynamo Dynamo', id: 'qualified-segment', connectedRepoUrls: [repoUrl] },
    ])

    const segmentId = await resolveProjectSegment(
      candidates,
      'slug',
      repoUrl,
      'http://api',
      'token',
    )

    expect(segmentId).toBe('qualified-segment')
    expect(backend.createdNames).toEqual([])
  })

  it('does not reuse a segment whose integration has the requested repo plus other repos', async () => {
    const backend = installFakeBackend([
      {
        name: 'Dynamo',
        id: 'shared-segment',
        connectedRepoUrls: [repoUrl, otherRepoUrl.toLowerCase()],
      },
    ])

    const segmentId = await resolveProjectSegment(
      candidates,
      'slug',
      repoUrl,
      'http://api',
      'token',
    )

    expect(backend.createdNames).toEqual(['Ai Dynamo Dynamo'])
    expect(segmentId).toBe('created-Ai Dynamo Dynamo')
  })

  it('does not reuse a segment whose integration has no mapped repos', async () => {
    const backend = installFakeBackend([
      { name: 'Dynamo', id: 'unmapped-segment', connectedRepoUrls: [] },
    ])

    const segmentId = await resolveProjectSegment(
      candidates,
      'slug',
      repoUrl,
      'http://api',
      'token',
    )

    expect(backend.createdNames).toEqual(['Ai Dynamo Dynamo'])
    expect(segmentId).toBe('created-Ai Dynamo Dynamo')
  })

  it.each([
    'https://github.com/AI-Dynamo/Dynamo',
    'https://github.com/ai-dynamo/dynamo/',
    'https://github.com/ai-dynamo/dynamo.git',
    'https://www.github.com/ai-dynamo/dynamo',
    'https://github.com/ai-dynamo/dynamo?tab=readme',
  ])('treats %s as the requested repo already connected', async (requestedUrl) => {
    const backend = installFakeBackend([
      {
        name: 'Dynamo',
        id: 'own-segment',
        connectedRepoUrls: ['https://github.com/ai-dynamo/dynamo'],
      },
    ])

    const segmentId = await resolveProjectSegment(
      candidates,
      'slug',
      requestedUrl,
      'http://api',
      'token',
    )

    expect(segmentId).toBe('own-segment')
    expect(backend.createdNames).toEqual([])
  })

  it('matches a stored url in a different form than the requested one', async () => {
    installFakeBackend([
      {
        name: 'Dynamo',
        id: 'own-segment',
        connectedRepoUrls: ['https://www.github.com/AI-Dynamo/Dynamo.git'],
      },
    ])

    const segmentId = await resolveProjectSegment(
      candidates,
      'slug',
      'https://github.com/ai-dynamo/dynamo',
      'http://api',
      'token',
    )

    expect(segmentId).toBe('own-segment')
  })

  it('throws when every candidate name is used by a connected project', async () => {
    const backend = installFakeBackend([
      { name: 'Dynamo', id: 'dynamods-segment', connectedRepoUrls: [otherRepoUrl.toLowerCase()] },
      {
        name: 'Ai Dynamo Dynamo',
        id: 'qualified-segment',
        connectedRepoUrls: [otherRepoUrl.toLowerCase()],
      },
    ])

    await expect(
      resolveProjectSegment(candidates, 'slug', repoUrl, 'http://api', 'token'),
    ).rejects.toThrow(
      'Every candidate project name ("Dynamo", "Ai Dynamo Dynamo") is already used by a project with a GitHub integration',
    )
    expect(backend.createdNames).toEqual([])
  })

  it('throws when the integration query fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('/segment/project/query')
          ? jsonResponse({ rows: [{ subprojects: [{ id: 'segment', name: 'Dynamo' }] }], count: 1 })
          : new Response('boom', { status: 500 }),
      ),
    )

    await expect(
      resolveProjectSegment(candidates, 'slug', repoUrl, 'http://api', 'token'),
    ).rejects.toThrow('Integration query returned HTTP 500')
  })
})

const now = new Date('2026-10-12T10:00:00.000Z')

function org(name: string, repoUrls: string[]): IGithubOrgSettings {
  return {
    name,
    url: `https://github.com/${name}`,
    logo: `${name}-logo`,
    fullSync: false,
    updatedAt: '2026-01-01T00:00:00.000Z',
    repos: repoUrls.map((url) => ({
      name: url.split('/').pop() as string,
      url,
      forkedFrom: null,
      updatedAt: '2026-01-01T00:00:00.000Z',
    })),
  }
}

describe('mergeGithubOrgSettings', () => {
  const incoming = buildGithubOrgSettings({
    owner: 'kubernetes',
    repo: 'kops',
    repoUrl: 'https://github.com/kubernetes/kops',
    orgLogo: 'new-logo',
    forkedFrom: null,
    now,
  })

  it('appends the org when the integration does not have it yet', () => {
    const existing = [org('helm', ['https://github.com/helm/helm'])]

    expect(mergeGithubOrgSettings(existing, incoming)).toEqual([...existing, incoming])
  })

  it('adds the repo to the existing org and keeps its metadata', () => {
    const existing = [org('kubernetes', ['https://github.com/kubernetes/kubernetes'])]

    const merged = mergeGithubOrgSettings(existing, incoming)

    expect(merged).toHaveLength(1)
    expect(merged[0].logo).toBe('kubernetes-logo')
    expect(merged[0].repos.map((repo) => repo.url)).toEqual([
      'https://github.com/kubernetes/kubernetes',
      'https://github.com/kubernetes/kops',
    ])
  })

  it('does not duplicate a repo already connected in another url form', () => {
    const existing = [org('Kubernetes', ['https://github.com/Kubernetes/Kops.git'])]

    const merged = mergeGithubOrgSettings(existing, incoming)

    expect(merged).toEqual(existing)
  })
})

describe('buildGithubIntegrationPayload', () => {
  it('maps every repo of every org to the segment and carries the integration id', () => {
    const orgs = [
      org('kubernetes', ['https://github.com/kubernetes/kubernetes']),
      org('helm', ['https://github.com/helm/helm', 'https://github.com/helm/charts']),
    ]

    const payload = buildGithubIntegrationPayload({ orgs, segmentId: 'seg', integrationId: 'int' })

    expect(payload).toEqual({
      integrationId: 'int',
      settings: { orgs, updateMemberAttributes: true },
      mapping: {
        'https://github.com/kubernetes/kubernetes': 'seg',
        'https://github.com/helm/helm': 'seg',
        'https://github.com/helm/charts': 'seg',
      },
      segments: ['seg'],
    })
  })

  it('keeps every existing repo on its current segment, in any url form', () => {
    const orgs = [org('helm', ['https://github.com/helm/helm', 'https://github.com/helm/charts'])]

    const payload = buildGithubIntegrationPayload({
      orgs,
      segmentId: 'seg',
      integrationId: 'int',
      existingMapping: { 'https://github.com/Helm/Helm.git': 'subproject' },
    })

    expect(payload).toMatchObject({
      mapping: {
        'https://github.com/helm/helm': 'subproject',
        'https://github.com/helm/charts': 'seg',
      },
      segments: ['seg'],
    })
  })

  it('omits the integration id for a new integration', () => {
    const payload = buildGithubIntegrationPayload({ orgs: [], segmentId: 'seg' })

    expect(payload).not.toHaveProperty('integrationId')
  })
})

describe('connectRepoToSegment', () => {
  const repoUrl = 'https://github.com/kubernetes/kops'

  function installConnectBackend(
    existingIntegration: {
      id: string
      orgs: IGithubOrgSettings[]
      mapping?: Record<string, string>
    } | null,
  ) {
    const connectPayloads: Record<string, unknown>[] = []
    const mappingRequests: string[] = []

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string, init?: { body?: string }) => {
        if (url.startsWith('https://api.github.com/')) {
          return new Response('', { status: 404 })
        }
        if (url.endsWith('/integration/query')) {
          const rows = existingIntegration
            ? [{ id: existingIntegration.id, settings: { orgs: existingIntegration.orgs } }]
            : []
          return jsonResponse({ rows, count: rows.length })
        }
        if (url.includes('/repositories?')) {
          mappingRequests.push(url)
          const rows = Object.entries(existingIntegration?.mapping ?? {}).map(
            ([repoUrl, segmentId]) => ({
              url: repoUrl,
              segment: { id: segmentId, name: segmentId },
            }),
          )
          return jsonResponse(rows)
        }
        if (url.endsWith('/github-nango-connect')) {
          connectPayloads.push(JSON.parse(init?.body ?? '{}'))
          return jsonResponse({})
        }
        return new Response('unexpected', { status: 500 })
      }),
    )

    return { connectPayloads, mappingRequests }
  }

  beforeEach(() => {
    vi.stubEnv('CROWD_API_SERVICE_URL', 'http://api')
    vi.stubEnv('CROWD_LF_AGENT_USER_TOKEN', 'token')
    vi.stubEnv('CROWD_GITHUB_PERSONAL_ACCESS_TOKENS', 'gh-token')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('creates a new integration when the segment has none', async () => {
    const { connectPayloads: payloads, mappingRequests } = installConnectBackend(null)

    const result = await connectRepoToSegment({ segmentId: 'seg', repoUrl })

    expect(result).toEqual({ outcome: 'onboarded', segmentId: 'seg', error: null })
    expect(mappingRequests).toEqual([])
    expect(payloads).toHaveLength(1)
    expect(payloads[0]).not.toHaveProperty('integrationId')
    expect(payloads[0]).toMatchObject({
      mapping: { [repoUrl]: 'seg' },
      segments: ['seg'],
    })
  })

  it('connects several repositories of one organization with a single call', async () => {
    const { connectPayloads: payloads } = installConnectBackend({
      id: 'int',
      orgs: [org('kubernetes', ['https://github.com/kubernetes/kubernetes'])],
      mapping: { 'https://github.com/kubernetes/kubernetes': 'seg' },
    })

    const result = await connectReposToSegment({
      segmentId: 'seg',
      repoUrls: [
        repoUrl,
        'https://github.com/kubernetes/kubectl',
        'https://github.com/Kubernetes/Minikube',
      ],
    })

    expect(result).toEqual({ outcome: 'onboarded', segmentId: 'seg', error: null })
    expect(payloads).toHaveLength(1)
    const [payload] = payloads as {
      settings: { orgs: IGithubOrgSettings[] }
      mapping: Record<string, string>
    }[]
    expect(payload.settings.orgs).toHaveLength(1)
    expect(payload.settings.orgs[0].repos.map((repo) => repo.url)).toEqual([
      'https://github.com/kubernetes/kubernetes',
      repoUrl,
      'https://github.com/kubernetes/kubectl',
      'https://github.com/kubernetes/minikube',
    ])
    expect(payload.mapping).toEqual({
      'https://github.com/kubernetes/kubernetes': 'seg',
      [repoUrl]: 'seg',
      'https://github.com/kubernetes/kubectl': 'seg',
      'https://github.com/kubernetes/minikube': 'seg',
    })
  })

  it('sends the existing repos back together with the new one on update', async () => {
    const { connectPayloads: payloads, mappingRequests } = installConnectBackend({
      id: 'int',
      orgs: [org('kubernetes', ['https://github.com/kubernetes/kubernetes'])],
      mapping: { 'https://github.com/kubernetes/kubernetes': 'seg' },
    })

    const result = await connectRepoToSegment({ segmentId: 'seg', repoUrl })

    expect(result.outcome).toBe('onboarded')
    expect(mappingRequests).toEqual(['http://api/integration/int/repositories?segments%5B%5D=seg'])
    expect(payloads[0]).toMatchObject({
      integrationId: 'int',
      mapping: { 'https://github.com/kubernetes/kubernetes': 'seg', [repoUrl]: 'seg' },
    })
  })

  it('leaves repos mapped to sibling subprojects on their segment', async () => {
    const { connectPayloads: payloads } = installConnectBackend({
      id: 'int',
      orgs: [
        org('kubernetes', [
          'https://github.com/kubernetes/kubernetes',
          'https://github.com/kubernetes/minikube',
        ]),
      ],
      mapping: {
        'https://github.com/kubernetes/kubernetes': 'seg',
        'https://github.com/kubernetes/minikube': 'minikube-subproject',
      },
    })

    await connectRepoToSegment({ segmentId: 'seg', repoUrl })

    expect(payloads[0]).toMatchObject({
      mapping: {
        'https://github.com/kubernetes/kubernetes': 'seg',
        'https://github.com/kubernetes/minikube': 'minikube-subproject',
        [repoUrl]: 'seg',
      },
      segments: ['seg'],
    })
  })

  it('returns an error result when the current mapping cannot be read', async () => {
    installConnectBackend({ id: 'int', orgs: [] })
    const fetchMock = vi.mocked(fetch)
    const original = fetchMock.getMockImplementation()
    fetchMock.mockImplementation(async (url, init) =>
      String(url).includes('/repositories?')
        ? new Response('boom', { status: 500, statusText: 'Internal Server Error' })
        : original!(url, init),
    )

    const result = await connectRepoToSegment({ segmentId: 'seg', repoUrl })

    expect(result.outcome).toBe('error')
    expect(result.error).toContain('Integration repositories returned HTTP 500')
  })

  it('stores a mixed-case url in its canonical lowercase form', async () => {
    const { connectPayloads: payloads } = installConnectBackend({
      id: 'int',
      orgs: [org('kubernetes', ['https://github.com/kubernetes/kubernetes'])],
    })

    const result = await connectRepoToSegment({
      segmentId: 'seg',
      repoUrl: 'https://GitHub.com/Kubernetes/Kops.git',
    })

    expect(result.outcome).toBe('onboarded')
    expect(payloads[0]).toMatchObject({
      integrationId: 'int',
      mapping: { 'https://github.com/kubernetes/kubernetes': 'seg', [repoUrl]: 'seg' },
    })
    expect(payloads[0]).not.toHaveProperty(['mapping', 'https://GitHub.com/Kubernetes/Kops.git'])
    expect(JSON.stringify(payloads[0])).not.toContain('Kops')
  })

  it('returns an error result when the connect call fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('/integration/query')
          ? jsonResponse({ rows: [], count: 0 })
          : new Response('boom', { status: 500 }),
      ),
    )

    const result = await connectRepoToSegment({ segmentId: 'seg', repoUrl })

    expect(result.outcome).toBe('error')
    expect(result.segmentId).toBe('seg')
    expect(result.error).toContain('GitHub integration returned HTTP 500')
  })

  it('returns an error result for a non GitHub url without calling the backend', async () => {
    const { connectPayloads: payloads } = installConnectBackend(null)

    const result = await connectRepoToSegment({
      segmentId: 'seg',
      repoUrl: 'https://gitlab.com/a/b',
    })

    expect(result.outcome).toBe('error')
    expect(payloads).toHaveLength(0)
  })

  it('returns an error result when the api configuration is missing', async () => {
    vi.stubEnv('CROWD_API_SERVICE_URL', '')

    const result = await connectRepoToSegment({ segmentId: 'seg', repoUrl })

    expect(result.outcome).toBe('error')
    expect(result.error).toContain('Missing API configuration')
  })
})

describe('readErrorBody', () => {
  it('returns the response body text', async () => {
    const response = new Response('{"error":"insightsProjects slug already exists"}')

    expect(await readErrorBody(response)).toBe('{"error":"insightsProjects slug already exists"}')
  })

  it('truncates a body longer than 500 characters', async () => {
    const response = new Response('a'.repeat(600))

    const body = await readErrorBody(response)

    expect(body).toBe(`${'a'.repeat(500)}…`)
  })

  it('returns an empty string when the body cannot be read', async () => {
    const response = new Response(null)
    // Consuming the body once locks the stream, so a second read fails.
    await response.text()

    expect(await readErrorBody(response)).toBe('')
  })
})
