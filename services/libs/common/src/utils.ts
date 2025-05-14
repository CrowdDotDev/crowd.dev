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

  async stop() {
    this.isStopped = true
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
