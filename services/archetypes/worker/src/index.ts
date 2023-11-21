import path from 'path'

import { NativeConnection, Worker as TemporalWorker, bundleWorkflowCode } from '@temporalio/worker'

import { Config, Service } from '@crowd/archetype-standard'
import { getDbConnection, DbStore } from '@crowd/database'
import { getDataConverter } from '@crowd/temporal'

// List all required environment variables, grouped per "component".
// They are in addition to the ones required by the "standard" archetype.
const envvars = {
  worker: [
    'CROWD_TEMPORAL_SERVER_URL',
    'CROWD_TEMPORAL_NAMESPACE',
    'CROWD_TEMPORAL_TASKQUEUE',
    'CROWD_TEMPORAL_ENCRYPTION_KEY_ID',
    'CROWD_TEMPORAL_ENCRYPTION_KEY',
  ],
  postgres: [
    'CROWD_DB_READ_HOST',
    'CROWD_DB_WRITE_HOST',
    'CROWD_DB_PORT',
    'CROWD_DB_USERNAME',
    'CROWD_DB_PASSWORD',
    'CROWD_DB_DATABASE',
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
  protected _postgresReader: DbStore
  protected _postgresWriter: DbStore

  constructor(config: Config, opts: Options) {
    super(config)

    this.options = opts
  }

  get postgres(): { reader: DbStore; writer: DbStore } | null {
    if (!this.options.postgres.enabled) {
      return null
    }

    return {
      reader: this._postgresReader,
      writer: this._postgresWriter,
    }
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

    try {
      const certificate = process.env['CROWD_TEMPORAL_CERTIFICATE']
      const privateKey = process.env['CROWD_TEMPORAL_PRIVATE_KEY']

      this.log.info(
        {
          address: process.env['CROWD_TEMPORAL_SERVER_URL'],
          certificate: certificate ? 'yes' : 'no',
          privateKey: privateKey ? 'yes' : 'no',
        },
        'Connecting to Temporal server as a worker!',
      )

      const connection = await NativeConnection.connect({
        address: process.env['CROWD_TEMPORAL_SERVER_URL'],
        tls:
          certificate && privateKey
            ? {
                clientCertPair: {
                  crt: Buffer.from(certificate, 'base64'),
                  key: Buffer.from(privateKey, 'base64'),
                },
              }
            : undefined,
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
        dataConverter: await getDataConverter(),
      })
    } catch (err) {
      throw new Error(err)
    }

    if (this.options.postgres.enabled) {
      try {
        const dbConnection = await getDbConnection({
          host: process.env['CROWD_DB_READ_HOST'],
          port: Number(process.env['CROWD_DB_PORT']),
          user: process.env['CROWD_DB_USERNAME'],
          password: process.env['CROWD_DB_PASSWORD'],
          database: process.env['CROWD_DB_DATABASE'],
        })

        this._postgresReader = new DbStore(this.log, dbConnection)
      } catch (err) {
        throw new Error(err)
      }

      try {
        const dbConnection = await getDbConnection({
          host: process.env['CROWD_DB_WRITE_HOST'],
          port: Number(process.env['CROWD_DB_PORT']),
          user: process.env['CROWD_DB_USERNAME'],
          password: process.env['CROWD_DB_PASSWORD'],
          database: process.env['CROWD_DB_DATABASE'],
        })

        this._postgresWriter = new DbStore(this.log, dbConnection)
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
    if (this.options.postgres.enabled) {
      this._postgresWriter.dbInstance.end()
      this._postgresReader.dbInstance.end()
    }

    await super.stop()
  }
}
