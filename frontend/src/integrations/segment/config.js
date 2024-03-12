import config from '@/config';

export default {
  enabled: config.isSegmentIntegrationEnabled,
  hideAsIntegration: !config.isSegmentIntegrationEnabled,
  name: 'Segment',
  description: 'Connect Segment to get a full view of your customer journey.',
  image:
      '/images/integrations/segment.svg',
  enterprise: true,
};
