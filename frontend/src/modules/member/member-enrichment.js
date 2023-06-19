import { h } from 'vue';
import pluralize from 'pluralize';
import Plans from '@/security/plans';
import { router } from '@/router';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { formatNumber } from '@/utils/number';
import Message from '@/shared/message/message';
import { FeatureFlag, FEATURE_FLAGS } from '@/featureFlag';

const growthEnrichmentMax = 1000;
const essentialEnrichmentMax = 5;

/**
 * @param {*} plan tenant plan (Essential | Growth | Enterprise)
 * @returns maximum number of enrichments
 */
export const getEnrichmentMax = (plan) => {
  if (
    plan === Plans.values.growth
    || plan === Plans.values.enterprise
  ) {
    return growthEnrichmentMax;
  }

  return essentialEnrichmentMax;
};

/**
 * @param {*} planEnrichmentCountMax maximum plan enrichment count
 * @returns if enrichment has reached limit
 */
export const checkEnrichmentLimit = (
  planEnrichmentCountMax,
) => {
  const isFeatureEnabled = FeatureFlag.isFlagEnabled(
    FEATURE_FLAGS.memberEnrichment,
  );

  if (!isFeatureEnabled) {
    ConfirmDialog({
      vertical: true,
      type: 'danger',
      title: `You have reached the limit of ${formatNumber(
        planEnrichmentCountMax,
      )} enrichments per month on your current plan`,
      message:
        'Upgrade your plan in order to increase your quota of available contributor enrichments.',
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

export const checkEnrichmentPlan = ({
  enrichmentCount,
  planEnrichmentCountMax,
}) => {
  if (enrichmentCount > planEnrichmentCountMax) {
    ConfirmDialog({
      vertical: true,
      type: 'danger',
      title: `You are trying to enrich a number of contributors above the limit of ${formatNumber(
        planEnrichmentCountMax,
      )} enrichments available in your current plan`,
      message:
        'Upgrade your plan in order to increase your quota of available contributor enrichments.',
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
    memberEnrichmentCount,
  )} out of ${formatNumber(
    planEnrichmentCountMax,
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
        growthEnrichmentMax,
      )} enrichments.`,
    ),
  ]);

  const message = plan === Plans.values.essential
    ? essentialMessage
    : commonMessage;

  Message.closeAll();
  Message.success(message, {
    title: `Successfully enriched ${pluralize(
      'contributor',
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
        isBulk ? 'Contributors are' : 'Contributor is'
      } being enriched`,
    },
  );
};
