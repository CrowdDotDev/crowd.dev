import {
  IIntegrationStream,
  IProcessStreamResults,
  IStepContext,
} from '../../../../../types/integration/stepResult'
import { IntegrationType } from '../../../../../types/integrationEnums'
import { IntegrationServiceBase } from '../../integrationServiceBase'

/* eslint class-methods-use-this: 0 */

/* eslint-disable @typescript-eslint/no-unused-vars */

export class LinkedinIntegrationService extends IntegrationServiceBase {
  constructor() {
    super(IntegrationType.LINKEDIN, 20)
  }

  async createMemberAttributes(context: IStepContext): Promise<void> {
    const log = this.logger(context)
    log.info('Creating member attributes')
  }

  async preprocess(context: IStepContext): Promise<void> {
    const log = this.logger(context)
    log.info('Preprocessing')
  }

  async getStreams(context: IStepContext): Promise<IIntegrationStream[]> {
    const log = this.logger(context)
    log.info('Getting streams')
    return undefined
  }

  async processStream(
    stream: IIntegrationStream,
    context: IStepContext,
  ): Promise<IProcessStreamResults> {
    const log = this.logger(context)
    log.info('Processing stream')
    return undefined
  }

  async postprocess(
    context: IStepContext,
    failedStreams?: IIntegrationStream[],
    remainingStreams?: IIntegrationStream[],
  ): Promise<void> {
    const log = this.logger(context)
    log.info('Postprocessing')
  }
}
