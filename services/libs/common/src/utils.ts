import { timeout } from './timing'

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

  private isStopped = false

  private isProcessing = false

  constructor(
    private readonly batchSize: number,
    private readonly timeoutSeconds: number,
    private readonly processor: (batch: T[]) => Promise<void>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly errorHandler: (batch: T[], err: any) => Promise<void>,
  ) {}

  public async addToBatch(element: T) {
    if (this.isStopped) {
      throw new Error('Batch processor is stopped')
    }

    while (this.isProcessing) {
      await timeout(50)
    }

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

    this.isProcessing = true
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

      this.isProcessing = false
    }
  }

  async stop() {
    this.isStopped = true
    while (this.isProcessing) {
      await timeout(50)
    }
    await this.processBatch()
  }
}

export const escapeNullByte = (str: string | null | undefined): string =>
  str ? str.replace(/\0/g, 'u0000') : str

export const redactNullByte = (str: string | null | undefined): string =>
  str ? str.replace(/\\u0000|\0/g, '[NULL]') : ''

export const replaceDoubleQuotes = (str: string | null | undefined): string =>
  str ? str.replace(/[\u201C\u201D\u0022\u201E\u201F\u2033\u2036"]/g, "'") : ''

export const dateEqualityChecker = (a, b) => {
  if (a instanceof Date) {
    a = a.toISOString()
  }
  if (b instanceof Date) {
    b = b.toISOString()
  }

  return a === b
}

export class ConcurrencyLimiter {
  private running = 0
  private queue: Array<() => void> = []
  private allJobs: Array<Promise<void>> = []

  constructor(private readonly maxConcurrency: number) {
    if (maxConcurrency < 1) {
      throw new Error('maxConcurrency must be at least 1')
    }
  }

  async execute(job: () => Promise<void>): Promise<void> {
    // If at capacity, wait for slot to free up
    if (this.running >= this.maxConcurrency) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve)
      })
    }

    // Job is now queued, increment running count
    this.running++

    // Execute job in background
    const jobPromise = (async () => {
      try {
        await job()
      } finally {
        this.running--
        // Process next queued item if any
        const next = this.queue.shift()
        if (next) next()
      }
    })()

    this.allJobs.push(jobPromise)
  }

  async waitForFinish(): Promise<void> {
    await Promise.all(this.allJobs)
  }
}
