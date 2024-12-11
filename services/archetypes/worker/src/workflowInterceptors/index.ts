import { WorkflowInterceptorsFactory } from '@temporalio/workflow'

import { WorkflowMonitoringInterceptor } from '../interceptors'

export const interceptors: WorkflowInterceptorsFactory = () => ({
  inbound: [new WorkflowMonitoringInterceptor()],
})
