import type { IntegrationConfig } from '@/config/integrations';

const image = new URL('@/assets/images/integrations/octolens.png', import.meta.url).href;

// The platforms whose mentions the Octolens connector emits.
export const octolensMentionPlatforms = [
  'github',
  'twitter',
  'linkedin',
  'reddit',
  'devto',
  'hackernews',
  'bluesky',
  'tiktok',
  'instagram',
  'youtube',
];

const octolens: IntegrationConfig = {
  key: 'octolens',
  name: 'Octolens',
  image,
  description:
    'Mentions of LF projects on GitHub, X/Twitter, LinkedIn, Reddit, Bluesky and more, matched to projects automatically.',
  showProgress: false,
  autoManaged: true,
};

export default octolens;
