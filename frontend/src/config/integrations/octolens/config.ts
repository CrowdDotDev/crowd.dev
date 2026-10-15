import type { IntegrationConfig } from '@/config/integrations';

const image = new URL('@/assets/images/integrations/octolens.svg', import.meta.url).href;

const octolens: IntegrationConfig = {
  key: 'octolens',
  name: 'Octolens',
  image,
  description:
    'Mentions of LF projects on GitHub, X/Twitter, LinkedIn and more, matched to projects automatically.',
  showProgress: false,
  autoManaged: true,
};

export default octolens;
