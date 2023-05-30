import { IMemberAttribute, IActivityData } from '@crowd/types'
import { Logger } from '@crowd/logging'
import { ICache, IIntegration, IIntegrationStream } from '@crowd/types'

export interface IIntegrationContext {
  onboarding: boolean
  integration: IIntegration
  log: Logger
  cache: ICache

  publishStream: <T>(identifier: string, metadata?: T) => Promise<void>
  updateIntegrationSettings: (settings: unknown) => Promise<void>

  abortRunWithError: (message: string, metadata?: unknown, error?: Error) => Promise<void>
}

export interface IGenerateStreamsContext extends IIntegrationContext {
  serviceSettings: IIntegrationServiceSettings
  platformSettings?: unknown
}

export interface IProcessStreamContext extends IIntegrationContext {
  stream: IIntegrationStream
  serviceSettings: IIntegrationServiceSettings
  platformSettings?: unknown

  publishData: <T>(data: T) => Promise<void>

  abortWithError: (message: string, metadata?: unknown, error?: Error) => Promise<void>
}

export interface IProcessDataContext extends IIntegrationContext {
  data: unknown
  platformSettings?: unknown

  abortWithError: (message: string, metadata?: unknown, error?: Error) => Promise<void>

  publishActivity: (activity: IActivityData) => Promise<void>
}

export type GenerateStreamsHandler = (ctx: IGenerateStreamsContext) => Promise<void>
export type ProcessStreamHandler = (ctx: IProcessStreamContext) => Promise<void>
export type ProcessDataHandler = (ctx: IProcessDataContext) => Promise<void>

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
   * that will be processed later by the processData function.
   *
   * Use ctx.publishData to store data for later processing
   * Use ctx.publishStream to create a new stream if needed
   * @param ctx Everything that is needed to process a single stream
   */
  processStream: ProcessStreamHandler

  /**
   * Function that will be called to process a single stream data.
   * The results of this function should be activities (with member information).
   *
   * Use ctx.publishActivity to publish an activity
   * @param ctx Everything that is needed to process a single stream data
   */
  processData: ProcessDataHandler

  // type of integration service
  type: string

  // list of supported member attributes that this integration can generate
  memberAttributes: IMemberAttribute[]

  // how often to check for new data
  // if undefined it will never check
  // if 0 it will check the same as if it was 1 - every minute
  checkEvery?: number
}

export interface IIntegrationServiceSettings {
  nangoUrl: string
  nangoSecretKey: string
  nangoId: string
}
