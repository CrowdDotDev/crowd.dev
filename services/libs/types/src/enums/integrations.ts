export enum IntegrationState {
  IN_PROGRESS = 'in-progress',
  DONE = 'done',
  ERROR = 'error',
  INACTIVE = 'inactive',
  WAITING_APPROVAL = 'waiting-approval',
}

export enum IntegrationRunState {
  DELAYED = 'delayed',
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  ERROR = 'error',
}

export enum MemberAttributeType {
  BOOLEAN = 'boolean',
  NUMBER = 'number',
  EMAIL = 'email',
  STRING = 'string',
  URL = 'url',
  DATE = 'date',
  MULTI_SELECT = 'multiSelect',
  SPECIAL = 'special',
}
