import Plans from '@/security/plans';
import { router } from '@/router';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';

const workflowMax = {
  scale: 'unlimited',
  enterprise: 'unlimited',
  growth: 10,
  essential: 2,
};

/**
 * @param {*} plan tenant plan (Essential | Growth | Enterprise)
 * @returns maximum number of workflows
 */
export const getWorkflowMax = (plan) => {
  if (plan === Plans.values.scale) {
    return workflowMax.scale;
  }
  if (plan === Plans.values.enterprise) {
    return workflowMax.enterprise;
  }
  if (
    plan === Plans.values.growth
  ) {
    return workflowMax.growth;
  }

  return workflowMax.essential;
};

export const showWorkflowLimitDialog = ({
  planWorkflowCountMax,
}) => {
  ConfirmDialog({
    vertical: true,
    type: 'danger',
    title:
      `You have reached the limit of ${planWorkflowCountMax} automations on your current plan`,
    message:
      'Upgrade your plan to get unlimited automations and take full advantage of this feature',
    confirmButtonText: 'Upgrade plan',
  }).then(() => {
    router.push('settings?activeTab=plans');
  });
};
