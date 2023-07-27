export enum NodeWorkerMessageType {
  INTEGRATION_CHECK = 'integration_check',
  INTEGRATION_PROCESS = 'integration_process',
  NODE_MICROSERVICE = 'node_microservice',
  DB_OPERATIONS = 'db_operations',
  PROCESS_WEBHOOK = 'process_webhook',
}

export enum PythonWorkerMessageType {
  MEMBERS_SCORE = 'members_score',
}

export interface PythonWorkerMessage {
  type: PythonWorkerMessageType
  member?: string
  tenant?: string
}
