export interface ICache {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  delete(key: string): Promise<number>
  increment(key: string, incrementBy?: number, ttlSeconds?: number): Promise<number>
  decrement(key: string, decrementBy?: number, ttlSeconds?: number): Promise<number>
  hget(key: string, field: string): Promise<string | null>
  hgetall(key: string): Promise<{ [key: string]: string }>
  hset(key: string, field: string, value: string): Promise<number>
}

export interface IRateLimiter {
  checkRateLimit(endpoint: string): Promise<void>
  incrementRateLimit(): Promise<void>
}

export interface IConcurrentRequestLimiter {
  checkConcurrentRequestLimit(integrationId: string): Promise<void>
  incrementConcurrentRequest(integrationId: string): Promise<void>
  decrementConcurrentRequest(integrationId: string): Promise<void>
  processWithLimit<T>(integrationId: string, func: () => Promise<T>): Promise<T>
}
