import Plans from '@/security/plans';
import { router } from '@/router';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { planLimits } from '@/security/plans-limits';

/**
 * @param {*} plan tenant plan (Essential | Growth | Enterprise)
 * @returns maximum number of workflows
 */
export const getWorkflowMax = (plan) => planLimits.automation[plan];

export const showWorkflowLimitDialog = ({
  planWorkflowCountMax,
}) => {
  ConfirmDialog({
    vertical: true,
    type: 'danger',
    title:
      `You have reached the limit of ${planWorkflowCountMax} active automations on your current plan`,
    message:
      'Upgrade your plan to increase the active automations quota and take full advantage of this feature',
    confirmButtonText: 'Upgrade plan',
    showCancelButton: false,
  }).then(() => {
    router.push('settings?activeTab=plans');
  });
};
