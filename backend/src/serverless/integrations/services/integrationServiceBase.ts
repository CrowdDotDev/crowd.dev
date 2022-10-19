import { SuperfaceClient } from '@superfaceai/one-sdk'
import moment from 'moment'
import {
  IIntegrationStream,
  IPreprocessResult,
  IProcessStreamResults,
  IStepContext,
  IStreamsResult,
} from '../../../types/integration/stepResult'
import { IntegrationType } from '../../../types/integrationEnums'
import { IS_TEST_ENV } from '../../../config'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export abstract class IntegrationServiceBase {
  /**
   * Every new integration should extend this class and implement its methods.
   *
   * @param type What integration is this?
   * @param globalLimit how many records to process before we stop
   * @param ticksBetweenChecks How many ticks to skip between each integration checks (each tick is 1 minute)
   */
  protected constructor(
    public readonly type: IntegrationType,
    public readonly globalLimit: number,
    public readonly ticksBetweenChecks: number,
  ) {}

  async preprocess(context: IStepContext): Promise<IPreprocessResult> {
    return {}
  }

  abstract createMemberAttributes(context: IStepContext): Promise<void>

  abstract getStreams(context: IStepContext, metadata?: any): Promise<IStreamsResult>

  abstract processStream(
    stream: IIntegrationStream,
    context: IStepContext,
    metadata?: any,
  ): Promise<IProcessStreamResults>

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
   * @param lastRecord The last activity we got
   * @param startTimestamp The timestamp when we started
   * @param maxRetrospect The maximum time we want to crawl
   * @returns Whether we are over the retrospect already
   */
  static isRetrospectOver(lastRecord: any, startTimestamp: number, maxRetrospect: number): boolean {
    return startTimestamp - moment(lastRecord.timestamp).unix() > maxRetrospect
  }
}
