import { IntegrationConfig } from '@/config/integrations';

const gitlab: IntegrationConfig = {
  key: 'gitlab',
  name: 'GitLab',
  image: '/images/integrations/gitlab.png',
  description: 'Connect GitLab to sync profile information, merge requests, issues, and more.',
};

export default gitlab;
