export interface IProcessActivityResult {
  success: boolean
  err?: Error
  metadata?: Record<string, unknown>
}
