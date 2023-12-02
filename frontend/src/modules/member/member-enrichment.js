import { h } from 'vue';
import pluralize from 'pluralize';
import Plans from '@/security/plans';
import { router } from '@/router';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { formatNumber } from '@/utils/number';
import Message from '@/shared/message/message';
import { FeatureFlag, FEATURE_FLAGS } from '@/utils/featureFlag';
import { planLimits } from '@/security/plans-limits';

/**
 * @param {*} plan tenant plan (Essential | Growth | Enterprise)
 * @returns maximum number of enrichments
 */
export const getEnrichmentMax = (plan) => planLimits.enrichment[plan];

/**
 * @returns if enrichment is enabled
 */
export const isEnrichmentFeatureEnabled = () => FeatureFlag.isFlagEnabled(
  FEATURE_FLAGS.memberEnrichment,
);

export const checkEnrichmentPlan = ({
  enrichmentCount,
  planEnrichmentCountMax,
}) => {
  if (enrichmentCount > planEnrichmentCountMax) {
    ConfirmDialog({
      vertical: true,
      type: 'danger',
      title: `You are trying to enrich a number of contacts above the limit of ${formatNumber(
        planEnrichmentCountMax,
      )} enrichments available in your current plan`,
      message:
        'Upgrade your plan in order to increase your quota of available contact enrichments.',
      icon: 'ri-error-warning-line',
      confirmButtonText: 'Upgrade plan',
      showCancelButton: false,
    }).then(() => {
      router.push('/settings?activeTab=plans');
    });

    return true;
  }

  return false;
};

export const showEnrichmentSuccessMessage = ({
  enrichedMembers = 1,
  memberEnrichmentCount,
  planEnrichmentCountMax,
  plan,
  isBulk,
}) => {
  const commonMessage = `${formatNumber(
    memberEnrichmentCount || 0,
  )} out of ${formatNumber(
    planEnrichmentCountMax || 0,
  )} enrichments used this month.`;

  const essentialMessage = h('span', null, [
    h('span', null, commonMessage),
    h(
      'a',
      {
        href: '/settings?activeTab=plans',
      },
      ' Upgrade your plan ',
    ),
    h(
      'span',
      `to increase your quota to ${formatNumber(
        planLimits.enrichment[Plans.values.growth],
      )} enrichments.`,
    ),
  ]);

  const message = plan === Plans.values.essential
    ? essentialMessage
    : commonMessage;

  Message.closeAll();
  Message.success(message, {
    title: `Successfully enriched ${pluralize(
      'contact',
      enrichedMembers,
      isBulk,
    )}`,
  });
};

export const showEnrichmentLoadingMessage = ({
  isBulk,
}) => {
  Message.info(
    "We'll let you know when the process is done.",
    {
      title: `${
        isBulk ? 'Contacts are' : 'Contact is'
      } being enriched`,
    },
  );
};
