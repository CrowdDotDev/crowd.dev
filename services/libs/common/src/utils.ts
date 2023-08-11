export const processPaginated = async <T>(
  dataLoader: (page: number) => Promise<T[]>,
  processor: (data: T[]) => Promise<boolean | void>,
): Promise<void> => {
  let page = 1
  let data = await dataLoader(page++)
  while (data.length > 0) {
    const result = await processor(data)
    if (result === true) {
      break
    }

    data = await dataLoader(page++)
  }
}

export class BatchProcessor<T> {
  private batch: T[] = []
  private timer?: NodeJS.Timeout

  constructor(
    private readonly batchSize: number,
    private readonly timeoutSeconds: number,
    private readonly processor: (batch: T[]) => Promise<void>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly errorHandler: (batch: T[], err: any) => Promise<void>,
  ) {}

  public async addToBatch(element: T) {
    this.batch.push(element)

    if (this.batch.length === 1) {
      this.startTimer()
    }

    if (this.batch.length >= this.batchSize) {
      await this.processBatch()
    }
  }

  private startTimer() {
    if (this.timer) {
      clearTimeout(this.timer)
    }

    this.timer = setTimeout(async () => {
      await this.processBatch()
    }, this.timeoutSeconds * 1000)
  }

  private async processBatch(): Promise<void> {
    if (this.batch.length === 0) return

    const clone = [...this.batch]
    this.batch = []
    try {
      await this.processor(clone)
    } catch (error) {
      await this.errorHandler(clone, error)
    } finally {
      if (this.timer) {
        clearTimeout(this.timer)
        this.timer = undefined
      }
    }
  }
}
