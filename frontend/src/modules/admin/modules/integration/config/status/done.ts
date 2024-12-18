import { IntegrationStatusConfig } from '@/modules/admin/modules/integration/config/status/index';

const done: IntegrationStatusConfig = {
  key: 'done',
  show: (integration: any) => integration.status === 'done',
  statuses: ['done'],
  status: {
    text: 'Connected',
    icon: 'checkbox-circle-fill',
    color: 'text-green-600',
  },
  actionBar: {
    background: 'bg-gray-50',
    color: 'text-gray-600',
  },
  tabs: {
    text: 'Connected',
    empty: 'No integrations connected',
    badge: 'bg-green-100',
  },
};

export default done;
