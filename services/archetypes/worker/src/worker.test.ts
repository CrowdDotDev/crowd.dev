import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ServiceWorker } from './worker'

const calls = vi.hoisted(() => [] as string[])

const fakeWorker = vi.hoisted(() => {
  let state = 'RUNNING'
  let finishRun: () => void = () => undefined
  return {
    getState: () => state,
    run: vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishRun = () => {
            state = 'STOPPED'
            calls.push('worker.drained')
            resolve()
          }
        }),
    ),
    shutdown: vi.fn(() => {
      state = 'DRAINING'
      calls.push('worker.shutdown')
    }),
    drain: () => finishRun(),
  }
})

const runtimeInstall = vi.hoisted(() => vi.fn())

vi.mock('@temporalio/worker', () => ({
  Runtime: { install: runtimeInstall },
  NativeConnection: { connect: vi.fn(async () => ({})) },
  Worker: { create: vi.fn(async () => fakeWorker) },
  bundleWorkflowCode: vi.fn(async () => ({})),
  makeTelemetryFilterString: () => '',
}))

vi.mock('@crowd/archetype-standard', () => ({
  Service: class {
    log = { info: vi.fn(), warn: vi.fn(), error: vi.fn() }
    name = 'test-worker'
    async init() {
      return undefined
    }
    async stop() {
      calls.push('temporal-client.close')
    }
  },
}))

vi.mock('@crowd/database', () => ({
  getDbConnection: vi.fn(async () => ({})),
  DbStore: class {
    dbInstance = { end: () => calls.push('postgres.end') }
  },
}))

vi.mock('@crowd/temporal', () => ({ getDataConverter: vi.fn(async () => ({})) }))
vi.mock('@crowd/opensearch', () => ({ OpenSearchService: class {}, getOpensearchClient: vi.fn() }))
vi.mock('@crowd/queue', () => ({ QueueFactory: { createQueueService: vi.fn() } }))
vi.mock('@crowd/slack', () => ({ SlackChannel: {} }))
vi.mock('@crowd/logging', () => ({ getServiceChildLogger: () => ({}) }))
vi.mock('./logging', () => ({ createTemporalLogger: () => ({}) }))
vi.mock('./activities', () => ({}))
vi.mock('./activities/activityInterceptor', () => ({ ActivityMonitoringInterceptor: class {} }))

const ENV = {
  CROWD_TEMPORAL_SERVER_URL: 'temporal:7233',
  CROWD_TEMPORAL_NAMESPACE: 'default',
  CROWD_TEMPORAL_TASKQUEUE: 'test',
  CROWD_TEMPORAL_ENCRYPTION_KEY_ID: 'k',
  CROWD_TEMPORAL_ENCRYPTION_KEY: 'v',
  CROWD_DB_READ_HOST: 'db',
  CROWD_DB_WRITE_HOST: 'db',
  CROWD_DB_PORT: '5432',
  CROWD_DB_USERNAME: 'u',
  CROWD_DB_PASSWORD: 'p',
  CROWD_DB_DATABASE: 'd',
}

function createServiceDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'archetype-worker-'))
  fs.mkdirSync(path.join(dir, 'src', 'activities'), { recursive: true })
  fs.writeFileSync(path.join(dir, 'src', 'activities', 'index.js'), 'module.exports = {}')
  return dir
}

describe('ServiceWorker.stop', () => {
  let serviceDir: string

  beforeEach(() => {
    for (const [key, value] of Object.entries(ENV)) {
      vi.stubEnv(key, value)
    }
    serviceDir = createServiceDir()
    vi.spyOn(process, 'cwd').mockReturnValue(serviceDir)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    fs.rmSync(serviceDir, { recursive: true, force: true })
    calls.length = 0
  })

  it('drains the temporal worker before closing postgres and the temporal client', async () => {
    const svc = new ServiceWorker(
      { producer: { enabled: false }, temporal: { enabled: true }, redis: { enabled: false } },
      { postgres: { enabled: true } },
    )
    await svc.init()
    const started = svc.start()

    const stopped = svc['stop']()
    await Promise.resolve()

    expect(runtimeInstall).toHaveBeenCalledWith(expect.objectContaining({ shutdownSignals: [] }))
    expect(calls).toEqual(['worker.shutdown'])

    fakeWorker.drain()
    await Promise.all([stopped, started])

    expect(calls).toEqual([
      'worker.shutdown',
      'worker.drained',
      'postgres.end',
      'postgres.end',
      'temporal-client.close',
    ])
  })
})
