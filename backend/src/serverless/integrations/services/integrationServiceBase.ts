import { SuperfaceClient } from '@superfaceai/one-sdk'
import moment from 'moment'
import {
  IIntegrationStream,
  IPreprocessResult,
  IProcessStreamResults,
  IStepContext,
  IStreamResultOperation,
  IStreamsResult,
} from '../../../types/integration/stepResult'
import { IntegrationType } from '../../../types/integrationEnums'
import { IS_TEST_ENV } from '../../../config'
import crypto from 'crypto'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export abstract class IntegrationServiceBase {
  /**
   * How many records to process before we stop
   */
  public globalLimit: number

  /**
   * If onboarding globalLimit will be multiplied by this factor for that run
   */
  public onboardingLimitModifierFactor: number

  /**
   * How many seconds between global limit reset (0 for auto reset)
   */
  public limitResetFrequencySeconds: number

  /**
   * Every new integration should extend this class and implement its methods.
   *
   * @param type What integration is this?
   * @param ticksBetweenChecks How many ticks to skip between each integration checks (each tick is 1 minute)
   */
  protected constructor(
    public readonly type: IntegrationType,
    public readonly ticksBetweenChecks: number,
  ) {
    this.globalLimit = 0
    this.onboardingLimitModifierFactor = 1.0
    this.limitResetFrequencySeconds = 0
  }

  async preprocess(context: IStepContext): Promise<IPreprocessResult> {
    return {}
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    // do nothing - override if something is needed
  }

  abstract getStreams(context: IStepContext, metadata?: any): Promise<IStreamsResult>

  abstract processStream(
    stream: IIntegrationStream,
    context: IStepContext,
    metadata?: any,
  ): Promise<IProcessStreamResults>

  async isProcessingFinished(
    context: IStepContext,
    currentStream: IIntegrationStream,
    lastOperations: IStreamResultOperation[],
    lastRecord?: any,
    lastRecordTimestamp?: number,
    metadata?: any,
  ): Promise<boolean> {
    return false
  }

  async postprocess(
    context: IStepContext,
    metadata?: any,
    failedStreams?: IIntegrationStream[],
    remainingStreams?: IIntegrationStream[],
  ): Promise<void> {
    // do nothing - override if something is needed
  }

  static superfaceClient(): SuperfaceClient {
    if (IS_TEST_ENV) {
      return undefined
    }

    return new SuperfaceClient()
  }

  /**
   * Check whether the last record is over the retrospect that we are interested in
   * @param lastRecordTimestamp The last activity timestamp we got
   * @param startTimestamp The timestamp when we started
   * @param maxRetrospect The maximum time we want to crawl
   * @returns Whether we are over the retrospect already
   */
  static isRetrospectOver(
    lastRecordTimestamp: number,
    startTimestamp: number,
    maxRetrospect: number,
  ): boolean {
    return startTimestamp - moment(lastRecordTimestamp).unix() > maxRetrospect
  }

  /**
   * Some activities will not have a remote(API) counterparts so they will miss sourceIds.
   * Since we're using sourceIds to find out if an activity already exists in our DB,
   * sourceIds are required when creating an activity.
   * This function generates an md5 hash that can be used as a sourceId of an activity.
   * Prepends string `gen-` to the beginning so generated and remote sourceIds
   * can be distinguished.
   *
   * @param {string} uniqueRemoteId remote member id from an integration. This id needs to be unique in a platform
   * @param {string} type type of the activity
   * @param {string} timestamp unix timestamp of the activity
   * @param {string} platform platform of the activity
   * @returns 32 bit md5 hash generated from the given data, prepended with string `gen-`
   */
  static generateSourceIdHash(
    uniqueRemoteId: string,
    type: string,
    timestamp: string,
    platform: string,
  ) {
    if (uniqueRemoteId === '' || type === '' || timestamp === '' || platform === '') {
      throw new Error('Bad hash input')
    }

    const data = `${uniqueRemoteId}-${type}-${timestamp}-${platform}`
    return `gen-${crypto.createHash('md5').update(data).digest('hex')}`
  }
}
