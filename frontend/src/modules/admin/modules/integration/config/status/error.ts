import { IntegrationStatusConfig } from '@/modules/admin/modules/integration/config/status/index';

const error: IntegrationStatusConfig = {
  key: 'error',
  show: (integration: any) => integration.status === 'error',
  statuses: ['error'],
  status: {
    text: 'Connection failed',
    icon: 'error-warning-fill',
    color: 'text-red-500',
  },
  actionBar: {
    background: 'bg-red-50',
    color: 'text-red-900',
  },
  tabs: {
    text: 'Connection failed',
    empty: 'No integrations with a failed connection',
    badge: 'bg-red-100',
  },
};

export default error;
