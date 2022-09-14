export enum NodeWorkerMessageType {
  INTEGRATION = 'integration',

  // automations
  AUTOMATION_TRIGGER = 'automation_trigger',
  AUTOMATION_PROCESS = 'automation_process',

  // weekly emails
  WEEKLY_ANALYTICS_EMAILS = 'weekly_analytics_emails',
}

export interface NodeWorkerMessage {
  type: NodeWorkerMessageType
}

export enum PythonWorkerMessageType {
  MEMBERS_SCORE = 'members_score',
  CHECK_MERGE = 'check_merge',
}

export interface PythonWorkerMessage {
  type: PythonWorkerMessageType
}
