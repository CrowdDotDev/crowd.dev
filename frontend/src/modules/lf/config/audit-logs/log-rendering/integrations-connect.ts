import { LogRenderingConfig } from '@/modules/lf/config/audit-logs/log-rendering/index';

const integrationsConnect: LogRenderingConfig = {
  label: 'Integration connected',
  changes: (log) => ({
    removals: ['<span>Stack Overflow: </span> identity'],
    additions: ['<span>Github: </span> identity'],
    changes: ['<span>Overflow: </span> identity', '<span>Stack: </span> identity'],
  }),
};

export default integrationsConnect;
