import { IntegrationStatusConfig } from '@/modules/admin/modules/integration/config/status/index';

const waitingApproval: IntegrationStatusConfig = {
  key: 'waitingApproval',
  show: (integration: any) => integration.status === 'waiting-approval',
  status: {
    text: 'Waiting for approval',
    icon: 'time-fill',
    color: 'text-gray-500',
  },
  actionBar: {
    background: 'bg-gray-50',
    color: 'text-gray-600',
  },
  tabs: {
    text: 'Waiting approval',
    empty: 'No integrations waiting approval',
    badge: 'bg-gray-50',
  },
};

export default waitingApproval;
