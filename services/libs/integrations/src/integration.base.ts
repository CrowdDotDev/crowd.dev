import { Logger, LoggerBase } from '@crowd/logging'
import { IIntegrationStream, IMemberAttribute } from '@crowd/types'
import { IGenerateStreamsContext, IProcessStreamContext } from './integration.data'

export abstract class IntegrationBase extends LoggerBase {
  protected constructor(public readonly type: string, parentLog: Logger) {
    super(parentLog)
  }

  public async getMemberAttributes(): Promise<IMemberAttribute[]> {
    return []
  }

  public abstract generateStreams(ctx: IGenerateStreamsContext): Promise<void>

  public abstract processStream(ctx: IProcessStreamContext): Promise<void>
}
