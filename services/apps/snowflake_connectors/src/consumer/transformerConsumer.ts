/**
 * Transformer consumer: Infinite loop that polls DB → transforms.
 *
 * Continuously polls the metadata store for completed exports
 * that need transformation, then runs the appropriate transformer.
 */

import { MetadataStore } from '../core/metadataStore'
import { S3Consumer } from '../core/s3Consumer'
import { createS3Client } from '../config/settings'
import { getPlatform } from '../integrations'

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
      // TODO: Poll metadataStore.getPendingTransformations()
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

export function createTransformerConsumer(): TransformerConsumer {
  const s3 = createS3Client()
  const metadataStore = new MetadataStore()
  const s3Consumer = new S3Consumer(s3)

  // TODO: Make pollingIntervalMs configurable
  return new TransformerConsumer(metadataStore, s3Consumer, 30_000)
}
