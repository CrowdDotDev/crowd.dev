import Plans from '@/security/plans';
import { router } from '@/router';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { planLimits } from '@/security/plans-limits';

/**
 * @returns maximum number of exports
 */
export const getExportMax = (plan) => planLimits.export[plan];

export const showExportDialog = ({
  tenantCsvExportCount,
  planExportCountMax,
  badgeContent,
}) => ConfirmDialog({
  vertical: true,
  type: 'info',
  title: 'Export CSV',
  message:
            'Receive in your inbox a link to download the CSV file ',
  icon: 'ri-file-download-line',
  confirmButtonText: 'Send download link to e-mail',
  cancelButtonText: 'Cancel',
  badgeContent,
  highlightedInfo: planExportCountMax === 'unlimited' ? undefined
    : `${tenantCsvExportCount}/${planExportCountMax} exports available in this plan used`,
});

export const showExportLimitDialog = ({
  planExportCountMax,
}) => {
  if (planExportCountMax === 'unlimited') {
    return;
  }
  ConfirmDialog({
    vertical: true,
    type: 'danger',
    title: `You have reached the limit of ${planExportCountMax} CSV exports`,
    message: 'Upgrade your plan to increase the CSV exports quota and take full advantage of this feature',
    confirmButtonText: 'Upgrade plan',
    showCancelButton: false,
  }).then(() => {
    router.push('settings?activeTab=plans');
  });
};
