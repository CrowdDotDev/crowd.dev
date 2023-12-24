import Plans from '@/security/plans';
import config from '@/config';
import { renderCal } from '@/utils/cals';

const crowdHostedPlans = Plans.values;
const communityPlans = Plans.communityValues;

const intoToCrowdDevCal = ({
  displayCalDialog,
}) => {
  displayCalDialog();
  setTimeout(() => {
    renderCal({
      calLink: 'team/CrowdDotDev/sales',
    });
  }, 0);
};

const customPlanCal = ({
  displayCalDialog,
}) => {
  displayCalDialog();
  setTimeout(() => {
    renderCal({
      calLink: 'team/CrowdDotDev/sales',
    });
  }, 0);
};

const openCustomerPortalLink = () => {
  window.open(config.stripe.customerPortalLink, '_blank');
};

/**
 * ctaLabel: Copy shown in the CTA dependent on the active plan.
 * Key of ctaLabel represents the active plan, value represents the copy that should appear on the corresponding column plan
 * ctaAction: Action triggered by CTA click dependent on the active plan.
 * Key of ctaAction represents the acttive plan, value represents the set of actions trigerred when the corresponding column plan button is clicked.
 */
export const plans = {
  crowdHosted: [
    {
      key: crowdHostedPlans.essential,
      title: 'Essential',
      description: 'Unify & act on your developer data',
      price: '$120/month',
      priceMonthly: '$150/month',
      features: [
        {
          includes: true,
          value: '3 seats',
        },
        {
          includes: true,
          value: '2k monthly active contacts',
        },
        {
          includes: true,
          value: '2 active automation workflows',
        },
        {
          includes: false,
          value: 'No data enrichment',
        },
        {
          includes: false,
          value: 'No Eagle Eye',
        },
        {
          includes: true,
          value: 'Default Reports',
        },
        {
          includes: true,
          value: 'Community & email support',
        },
        {
          includes: true,
          value: 'Full API access & data export',
        },
        {
          includes: true,
          value: 'Integrates with',
          integrations: ['github', 'discord', 'slack', 'discourse', 'devto', 'hackernews', 'reddit', 'zapier', 'n8n'],
        },
      ],
      ctaLabel: {
        [Plans.values.none]: 'Start 30-days free trial',
        [Plans.values.essential]: null,
        [Plans.values.eagleEye]: 'Downgrade to Essential',
        [Plans.values.growth]: 'Downgrade to Essential',
        [Plans.values.scale]: 'Downgrade to Essential',
        [Plans.values.enterprise]: 'Downgrade to Essential',
      },
      ctaAction: {
        [Plans.values.none]: ({ monthlyPayment }) => {
          const monthlyLink = config.stripe.essentialMonthlyPaymentLink;
          const yearlyLink = config.stripe.essentialYearlyPaymentLink;
          window.open(monthlyPayment ? monthlyLink : yearlyLink, '_self');
        },
        [Plans.values.essential]: ({ monthlyPayment }) => {
          const monthlyLink = config.stripe.essentialMonthlyPaymentLink;
          const yearlyLink = config.stripe.essentialYearlyPaymentLink;
          window.open(monthlyPayment ? monthlyLink : yearlyLink, '_self');
        },
        [Plans.values.eagleEye]: openCustomerPortalLink,
        [Plans.values.growth]: openCustomerPortalLink,
        [Plans.values.scale]: openCustomerPortalLink,
        [Plans.values.enterprise]: openCustomerPortalLink,
      },
    },
    {
      key: crowdHostedPlans.scale,
      title: 'Scale',
      description:
        'Commercialize your developer-first product',
      price: '$400/month',
      priceMonthly: '$450/month',
      features: [
        {
          includes: true,
          value: 'Unlimited seats',
        },
        {
          includes: true,
          value: '10k monthly active contacts',
        },
        {
          includes: true,
          value: '20 active automation workflows',
        },
        {
          includes: true,
          value: 'Smart data enrichment',
        },
        {
          includes: true,
          value: 'Eagle Eye for content monitoring & inspiration',
        },
        {
          includes: true,
          value: 'Default & custom reports',
        },
        {
          includes: true,
          value: 'Shared Slack',
        },
        {
          includes: true,
          value: 'Full API access & data export',
        },
        {
          includes: true,
          value: 'Integrates with Essential integrations and',
          integrations: ['linkedin', 'twitter', 'hubspot'],
        },
      ],
      ctaLabel: {
        [Plans.values.none]: 'Start 30-days free trial',
        [Plans.values.eagleEye]: 'Upgrade to Scale',
        [Plans.values.essential]: 'Upgrade to Scale',
        [Plans.values.growth]: 'Upgrade to Scale',
        [Plans.values.enterprise]: 'Downgrade to Scale',
      },
      ctaAction: {
        [Plans.values.none]: ({ monthlyPayment }) => {
          const monthlyLink = config.stripe.scaleMonthlyPaymentLink;
          const yearlyLink = config.stripe.scaleYearlyPaymentLink;
          window.open(monthlyPayment ? monthlyLink : yearlyLink, '_self');
        },
        [Plans.values.eagleEye]: ({ monthlyPayment }) => {
          const monthlyLink = config.stripe.scaleMonthlyPaymentLink;
          const yearlyLink = config.stripe.scaleYearlyPaymentLink;
          window.open(monthlyPayment ? monthlyLink : yearlyLink, '_self');
        },
        [Plans.values.essential]: ({ monthlyPayment }) => {
          const monthlyLink = config.stripe.scaleMonthlyPaymentLink;
          const yearlyLink = config.stripe.scaleYearlyPaymentLink;
          window.open(monthlyPayment ? monthlyLink : yearlyLink, '_self');
        },
        [Plans.values.growth]: ({ monthlyPayment }) => {
          const monthlyLink = config.stripe.scaleMonthlyPaymentLink;
          const yearlyLink = config.stripe.scaleYearlyPaymentLink;
          window.open(monthlyPayment ? monthlyLink : yearlyLink, '_self');
        },
        [Plans.values.enterprise]: openCustomerPortalLink,
      },
    },
    {
      key: crowdHostedPlans.enterprise,
      title: 'Enterprise',
      description:
        'Tailored to your needs',
      price: 'Custom',
      features: [
        {
          includes: true,
          value: 'Unlimited seats',
        },
        {
          includes: true,
          value: 'Unlimited monthly active contacts',
        },
        {
          includes: true,
          value: 'Unlimited active automation workflows',
        },
        {
          includes: true,
          value: 'Smart data enrichment',
        },
        {
          includes: true,
          value: 'Eagle Eye for content monitoring & inspiration',
        },
        {
          includes: true,
          value: 'Default & custom reports',
        },
        {
          includes: true,
          value: 'Shared Slack & dedicated CSM',
        },
        {
          includes: true,
          value: 'Full API access & data export',
        },
        {
          includes: true,
          value: 'Integrates with Scale integrations and',
          integrations: ['salesforce', 'segment', 'census', 'snowflake', 'bigquery'],
        },
      ],
      ctaLabel: {
        [Plans.values.none]: 'Book a call',
        [Plans.values.eagleEye]: 'Book a call',
        [Plans.values.essential]: 'Book a call',
        [Plans.values.growth]: 'Book a call',
        [Plans.values.scale]: 'Book a call',
      },
      ctaAction: {
        [Plans.values.none]: customPlanCal,
        [Plans.values.eagleEye]: customPlanCal,
        [Plans.values.essential]: customPlanCal,
        [Plans.values.growth]: customPlanCal,
        [Plans.values.scale]: customPlanCal,
      },
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
        'Unlimited community contacts & activities',
        'Community management',
        'Community intelligence',
        'Integrations with GitHub, Discord, Slack, X/Twitter, DEV, Hacker News',
        'Community support',
      ],
      ctaLabel: {
        [Plans.communityValues.custom]: 'Downgrage to Community',
      },
      ctaAction: {
        [Plans.communityValues.custom]: openCustomerPortalLink,
      },
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
        'Unlimited contact enrichments (automated)',
      ],
      ctaLabel: {
        [Plans.communityValues.community]: 'Book a call',
      },
      ctaAction: {
        [Plans.communityValues.community]: customPlanCal,
      },
    },
  ],
};
