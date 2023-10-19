import path from 'path'

import { NativeConnection, Worker as TemporalWorker, bundleWorkflowCode } from '@temporalio/worker'

import { Config, Service } from '@crowd/standard'
import { getDbConnection, DbStore } from '@crowd/database'

// List all required environment variables, grouped per "component".
// They are in addition to the ones required by the "standard" archetype.
const envvars = {
  worker: ['CROWD_TEMPORAL_SERVER_URL', 'CROWD_TEMPORAL_NAMESPACE', 'CROWD_TEMPORAL_TASKQUEUE'],
  postgres: [
    'CROWD_POSTGRES_HOST',
    'CROWD_POSTGRES_PORT',
    'CROWD_POSTGRES_USER',
    'CROWD_POSTGRES_PASSWORD',
    'CROWD_POSTGRES_DATABASE',
  ],
}

/*
Options is used to configure the worker service.
*/
export interface Options {
  postgres: {
    enabled: boolean
  }
}

/*
ServiceWorker holds all details and methods to run a worker services at crowd.dev.
*/
export class ServiceWorker extends Service {
  readonly options: Options

  protected _worker: TemporalWorker
  protected _postgres: DbStore

  constructor(config: Config, opts: Options) {
    super(config)

    this.options = opts
  }

  get postgres(): DbStore | null {
    if (!this.options.postgres.enabled) {
      return null
    }

    return this._postgres
  }

  // We first need to ensure a standard service can be initialized given the config
  // and environment variables.
  override async init() {
    try {
      await super.init()
    } catch (err) {
      throw new Error(err)
    }

    // We can now init tasks specific to a consumer service. Before actually
    // starting the service, we need to ensure required environment variables
    // are set.
    const missing = []
    envvars.worker.forEach((envvar) => {
      if (!process.env[envvar]) {
        missing.push(envvar)
      }
    })

    // Only validate PostgreSQL-related environment variables if enabled.
    if (this.options.postgres.enabled) {
      envvars.postgres.forEach((envvar) => {
        if (!process.env[envvar]) {
          missing.push(envvar)
        }
      })
    }

    // There's no point in continuing if a variable is missing.
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`)
    }

    // TODO: Handle TLS for Temporal Cloud.
    try {
      const connection = await NativeConnection.connect({
        address: process.env['CROWD_TEMPORAL_SERVER_URL'],
        // tls:
      })

      const workflowBundle = await bundleWorkflowCode({
        workflowsPath: path.resolve('./src/workflows'),
      })

      this._worker = await TemporalWorker.create({
        connection: connection,
        identity: this.name,
        namespace: process.env['CROWD_TEMPORAL_NAMESPACE'],
        taskQueue: process.env['CROWD_TEMPORAL_TASKQUEUE'],
        enableSDKTracing: true,
        showStackTraceSources: true,
        workflowBundle: workflowBundle,
        activities: require(path.resolve('./src/activities')),
      })
    } catch (err) {
      throw new Error(err)
    }

    if (this.options.postgres.enabled) {
      try {
        const dbConnection = await getDbConnection({
          host: process.env['CROWD_POSTGRES_HOST'],
          port: Number(process.env['CROWD_POSTGRES_PORT']),
          user: process.env['CROWD_POSTGRES_USER'],
          password: process.env['CROWD_POSTGRES_PASSWORD'],
          database: process.env['CROWD_POSTGRES_DATABASE'],
        })

        this._postgres = new DbStore(this.log, dbConnection)
      } catch (err) {
        throw new Error(err)
      }
    }
  }

  // Actually start the Temporal worker.
  async start() {
    try {
      await this._worker.run()
    } catch (err) {
      throw new Error(err)
    }
  }

  // Stop allows to gracefully stop the service. Order for closing connections
  // matters. We need to stop the Temporal worker before closing other connections.
  protected override async stop() {
    this._worker.shutdown()
    if (this.options.postgres.enabled) {
      this._postgres.dbInstance.end()
    }

    await super.stop()
  }
}
