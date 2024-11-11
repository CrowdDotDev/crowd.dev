import { IntegrationConfig } from '@/config/integrations';

const gerrit: IntegrationConfig = {
  key: 'gerrit',
  name: 'Gerrit',
  image: '/images/integrations/gerrit.png',
  description: 'Connect Gerrit to sync documentation activities from your repos.',
};

export default gerrit;
