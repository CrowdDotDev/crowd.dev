/**
 * Transformer consumer: Infinite loop that polls DB → transforms.
 *
 * Continuously polls the metadata store for pending jobs
 * that need transformation, then runs the appropriate transformer.
 */

import { getDbConnection, WRITE_DB_CONFIG } from '@crowd/database'

import { MetadataStore } from '../core/metadataStore'
import { S3Consumer } from '../core/s3Consumer'

export class TransformerConsumer {
  private running = false

  constructor(
    private readonly metadataStore: MetadataStore,
    private readonly s3Consumer: S3Consumer,
    private readonly pollingIntervalMs: number,
  ) {}

  /**
   * Start the infinite polling loop.
   */
  async start(): Promise<void> {
    this.running = true

    while (this.running) {
      // TODO: Poll metadataStore.getPendingJobs()
      // TODO: For each pending export, look up platform via getPlatform()
      // TODO: Download data from S3 via s3Consumer
      // TODO: Run the platform's transformer.transformRow()
      // TODO: Update metadata store with transformation result
      // TODO: Sleep for pollingIntervalMs before next poll

      await this.sleep(this.pollingIntervalMs)
    }
  }

  /**
   * Gracefully stop the consumer loop.
   */
  stop(): void {
    this.running = false
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

export async function createTransformerConsumer(): Promise<TransformerConsumer> {
  const db = await getDbConnection(WRITE_DB_CONFIG())
  const metadataStore = new MetadataStore(db)
  const s3Consumer = new S3Consumer()

  // TODO: Make pollingIntervalMs configurable
  return new TransformerConsumer(metadataStore, s3Consumer, 30_000)
}
