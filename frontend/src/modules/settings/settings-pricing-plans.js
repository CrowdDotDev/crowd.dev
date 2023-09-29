import Plans from '@/security/plans';

const crowdHostedPlans = Plans.values;
const communityPlans = Plans.communityValues;

export const plans = {
  crowdHosted: [
    {
      key: crowdHostedPlans.essential,
      title: 'Essential',
      description: 'Understand & manage your community',
      price: 'Free',
      features: [
        '5 seats',
        'Unlimited community members, organizations & activities',
        'Community management',
        'Community intelligence',
        'Full API access & native integrations with GitHub, Discord, Slack, Twitter, DEV, Reddit, and Hacker News',
        '5 member enrichments per month (manual)',
        '2 active workflows & CSV exports per month',
        'Community & email support',
      ],
    },
    {
      key: crowdHostedPlans.growth,
      title: 'Growth',
      description: 'Grow your community',
      price: '$150/month',
      featuresNote: 'Everything in Essential, plus:',
      features: [
        'Eagle Eye',
        '1,000 member enrichments per month (manual)',
        '200 config enrichments per month (automated)',
        '10 active workflows & CSV exports per month',
        'Slack connect support',
        'LinkedIn integration',
      ],
      sale: '🐦 Early bird offer',
    },
    {
      key: crowdHostedPlans.scale,
      title: 'Scale',
      description:
        'Unlock community-led growth for your company',
      price: 'Custom price',
      featuresNote: 'Everything in Growth, plus:',
      features: [
        'Activity categorization & topic analysis',
        'Integrations with CRMs & CDPs',
        'Unlimited member & config enrichment (automated)',
        'Unlimited active workflows & CSV exports per month',
        'Dedicated community expert',
      ],
    },
  ],
  community: [
    {
      key: communityPlans.community,
      title: 'Community',
      description:
        "Keep ownership of your data and host crowd.dev's community version for free on your own premises",
      price: 'Free',
      features: [
        'Unlimited seats',
        'Unlimited community members & activities',
        'Community management',
        'Community intelligence',
        'Integrations with GitHub, Discord, Slack, Twitter, DEV, Hacker News',
        'Community support',
      ],
    },
    {
      key: communityPlans.custom,
      title: 'Custom',
      description:
        "Get access to crowd.dev's premium features and support, and host the platform on your own premises",
      price: 'On request',
      featuresNote: 'Everything in Community, plus:',
      features: [
        'Community growth',
        'Organization-level insights',
        'Custom integrations',
        'Enterprise-grade support',
        'LinkedIn integration',
        'Unlimited member enrichments (automated)',
      ],
    },
  ],
};
