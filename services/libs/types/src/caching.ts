export interface ICache {
  get(key: string): Promise<string | null>
  set(key: string, value: string, ttlSeconds: number): Promise<void>
  delete(key: string): Promise<number>
  increment(key: string, incrementBy?: number, ttlSeconds?: number): Promise<number>
}
