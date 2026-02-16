/**
 * Database operations for export metadata.
 *
 * Tracks export runs, statuses, timestamps, and file manifests
 * to enable incremental exports and consumer polling.
 */

export interface ExportMetadata {
  id: string
  platform: string
  runTimestamp: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  totalRows: number
  totalBytes: number
  exportedFiles: string[]
  error?: string
}

export class MetadataStore {
  constructor() {}

  /**
   * Record the start of a new export run.
   */
  async createExportRun(platform: string): Promise<ExportMetadata> {
    // TODO: Insert a new export run record in the database
    throw new Error('Not implemented')
  }

  /**
   * Update an existing export run with results.
   */
  async updateExportRun(id: string, update: Partial<ExportMetadata>): Promise<void> {
    // TODO: Update the export run record
    throw new Error('Not implemented')
  }

  /**
   * Get the latest completed export run for a platform.
   */
  async getLastCompletedRun(platform: string): Promise<ExportMetadata | null> {
    // TODO: Query the database for the latest completed run
    throw new Error('Not implemented')
  }

  /**
   * Get all pending export runs ready for transformation.
   */
  async getPendingTransformations(): Promise<ExportMetadata[]> {
    // TODO: Query the database for completed exports not yet transformed
    throw new Error('Not implemented')
  }
}
