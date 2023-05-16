import { IMemberAttribute } from '@crowd/types'
import { Logger } from '@crowd/logging'
import { ICache, IIntegration, IIntegrationStream } from '@crowd/types'

export interface IGenerateStreamsContext {
  onboarding: boolean
  integration: IIntegration

  publishStream: (identifier: string, metadata?: unknown) => Promise<void>
  updateIntegrationSettings: (settings: unknown) => Promise<void>

  abortWithError: (message: string, metadata?: unknown) => Promise<void>

  log: Logger
  cache: ICache
}

export interface IProcessStreamContext {
  integration: IIntegration
  stream: IIntegrationStream

  publishData: (data: unknown) => Promise<void>
  publishStream: (identifier: string, metadata?: unknown) => Promise<void>
  updateIntegrationSettings: (settings: unknown) => Promise<void>

  abortWithError: (message: string, metadata?: unknown) => Promise<void>

  log: Logger
  cache: ICache
}

export type GenerateStreamsHandler = (ctx: IGenerateStreamsContext) => Promise<void>
export type ProcessStreamHandler = (ctx: IProcessStreamContext) => Promise<void>

export interface IIntegrationDescriptor {
  /**
   * Function that will be called to generate initial streamsfor the integration run.
   * Ideally this function should not call any external APIs and generate just initial streams
   * from which more streams can be generated later via processStream function.
   *
   * Use ctx.publishStream to create a new stream
   * @param ctx Everything that is needed to generate streams
   */
  generateStreams: GenerateStreamsHandler

  /**
   * Function that will be called to process a single stream.
   * The results of this function should be raw data fetched from external API
   * that will be processed later by the processStreamData function.
   *
   * Use ctx.publishData to store data for later processing
   * Use ctx.publishStream to create a new stream if needed
   * @param ctx Everything that is needed to process a single stream
   */
  processStream: ProcessStreamHandler

  // type of integration service
  type: string

  // list of supported member attributes that this integration can generate
  memberAttributes: IMemberAttribute[]

  // how often to check for new data
  // if undefined it will never check
  // if 0 it will check the same as if it was 1 - every minute
  checkEvery?: number
}
