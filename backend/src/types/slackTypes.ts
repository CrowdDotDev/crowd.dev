import { SlackMessageDto } from 'slack-block-builder'

export enum SlackCommand {
  HELP = 'help',
  PRINT_TENANT = 'print-tenant',
  SET_TENANT_PLAN = 'set-tenant-plan',
}

export enum SlackCommandParameterType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  UUID = 'uuid',
  DATE = 'date',
}

export interface SlackCommandParameter {
  name: string
  short?: string
  required: boolean
  description: string
  type: SlackCommandParameterType
  default?: any
  allowedValues?: any[]
}

export interface SlackCommandDefinition {
  command: SlackCommand
  shortVersion?: string
  description: string
  parameters?: SlackCommandParameter[]
  executor: (params: any) => Promise<SlackMessageDto>
}

export interface SlackParameterParseResult {
  params?: any
  error?: SlackMessageDto
}
