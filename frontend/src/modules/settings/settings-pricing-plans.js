import Plans from '@/security/plans'

const crowdHostedPlans = Plans.values
const communityPlans = Plans.communityValues

export const plans = {
  crowdHosted: [
    {
      key: crowdHostedPlans.essential,
      title: 'Essential',
      description: 'Understand & manage your community',
      price: 'Free',
      features: [
        'Unlimited seats',
        'Unlimited community members & activities',
        'Community management',
        'Community intelligence',
        'Full API access & native integrations with GitHub, Discord, Slack, Twitter, DEV, and Hacker News',
        '2 active workflows & CSV exports per month',
        'Community & email support'
      ]
    },
    {
      key: crowdHostedPlans.growth,
      title: 'Growth',
      description: 'Grow your community',
      price: '$150/month',
      featuresNote: 'Everything in Essential, plus:',
      features: [
        'Community growth',
        'Organization-level insights',
        '10 active workflows & CSV exports per month',
        'Slack connect support',
        'LinkedIn integration'
      ],
      sale: '🐦 Early bird offer'
    },
    {
      key: crowdHostedPlans.enterprise,
      title: 'Custom',
      description:
        'Unlock community-led growth for your company',
      price: 'from $850/month',
      featuresNote: 'Everything in Growth, plus:',
      features: [
        'Powerful enrichment for members & organizations',
        'Activity categorization & topic analysis',
        'Integrations with CRMs & CDPs',
        'Unlimited active workflows & CSV exports per month',
        'Dedicated community expert'
      ]
    }
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
        'Community support'
      ]
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
        'LinkedIn integration'
      ]
    }
  ]
}
