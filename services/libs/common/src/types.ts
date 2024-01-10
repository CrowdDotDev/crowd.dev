export interface PageData<T> {
  rows: T[]
  count: number
  limit: number
  offset: number
}

export class TimeoutError extends Error {
  constructor(public readonly timeout: number, public readonly unit: string) {
    super(`Process timeout after ${timeout} ${unit}!`)
    Object.setPrototypeOf(this, TimeoutError.prototype)
  }
}
