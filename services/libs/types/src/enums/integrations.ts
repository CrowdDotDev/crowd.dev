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
  INTEGRATION_DELETED = 'integration-deleted',
}

export enum IntegrationStreamState {
  DELAYED = 'delayed',
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  ERROR = 'error',
}

export enum IntegrationStreamType {
  ROOT = 'root',
  CHILD = 'child',
}

export enum IntegrationStreamDataState {
  DELAYED = 'delayed',
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  ERROR = 'error',
}

export enum IntegrationResultState {
  PENDING = 'pending',
  PROCESSING = 'processing',
  PROCESSED = 'processed',
  ERROR = 'error',
}

export enum IntegrationResultType {
  ACTIVITY = 'activity',
}
