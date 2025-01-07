import { router } from '@/router';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';


export const showWorkflowLimitDialog = () => {
  ConfirmDialog({
    vertical: true,
    type: 'danger',
    title:
      `You have reached the limit of unlimited active automations on your current plan`,
    message:
      'Upgrade your plan to increase the active automations quota and take full advantage of this feature',
    confirmButtonText: 'Upgrade plan',
    showCancelButton: false,
  }).then(() => {
    router.push('settings?activeTab=plans');
  });
};
