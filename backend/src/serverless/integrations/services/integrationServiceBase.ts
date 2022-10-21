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
}
