import { IntegrationStatusConfig } from '@/modules/admin/modules/integration/config/status/index';

const connecting: IntegrationStatusConfig = {
  key: 'connecting',
  show: (integration: any) => integration.status === 'in-progress',
  statuses: ['in-progress'],
  status: {
    text: 'Connecting',
    icon: 'loader-4-line animate-spin',
    color: 'text-secondary-500',
  },
  actionBar: {
    background: 'bg-primary-50',
    color: 'text-secondary-500',
  },
  tabs: {
    text: 'In progress',
    empty: 'No integrations with connection in progress',
    badge: 'bg-primary-50',
  },
};

export default connecting;
