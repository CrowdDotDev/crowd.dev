import { Consumer as KafkaConsumer } from 'kafkajs'

import { Config, Service } from '@crowd/archetype-standard'

// List all required environment variables, grouped per "component".
// They are in addition to the ones required by the "standard" archetype.
const envvars = {
  consumer: ['CROWD_KAFKA_TOPICS', 'CROWD_KAFKA_GROUP_ID'],
}

/*
Options is used to configure the consumer service.
*/
export interface Options {
  maxWaitTimeInMs: number
  retryPolicy: {
    initialRetryTime: number
    maxRetryTime: number
    retries: number
  }
}

/*
ServiceConsumer holds all details and methods to run a consumer services at
crowd.dev.
*/
export class ServiceConsumer extends Service {
  readonly options: Options

  protected _consumer: KafkaConsumer

  constructor(config: Config, opts: Options) {
    super(config)

    this.options = opts
  }

  get consumer(): KafkaConsumer {
    return this._consumer
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
    envvars.consumer.forEach((envvar) => {
      if (!process.env[envvar]) {
        missing.push(envvar)
      }
    })

    // There's no point in continuing if a variable is missing.
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`)
    }

    try {
      this._consumer = this._kafka.consumer({
        groupId: process.env['CROWD_KAFKA_GROUP_ID'],
        maxWaitTimeInMs: this.options.maxWaitTimeInMs || 2000,
        retry: this.options.retryPolicy,
      })

      await this._consumer.connect()
    } catch (err) {
      throw new Error(err)
    }
  }

  // Actually start the consumer's subscription.
  async start() {
    const topics = process.env['CROWD_KAFKA_TOPICS']

    try {
      await this._consumer.subscribe({
        topics: topics.split(','),
      })
    } catch (err) {
      throw new Error(err)
    }
  }

  // Stop allows to gracefully stop the service. Order for closing connections
  // matters. We need to stop the Kafka consumer before closing other connections.
  protected override async stop() {
    await this._consumer.disconnect()
    await super.stop()
  }
}
