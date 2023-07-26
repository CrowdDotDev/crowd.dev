import Plans from '@/security/plans';
import { router } from '@/router';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';

const exportMax = {
  scale: 'unlimited',
  enterprise: 'unlimited',
  growth: 10,
  essential: 2,
};

/**
 * @param {*} plan tenant plan (Essential | Growth | Enterprise)
 * @returns maximum number of exports
 */
export const getExportMax = (plan) => {
  if (plan === Plans.values.enterprise) {
    return exportMax.enterprise;
  } if (
    plan === Plans.values.growth
  ) {
    return exportMax.growth;
  }

  return exportMax.essential;
};

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
  highlightedInfo: `${tenantCsvExportCount}/${planExportCountMax} exports available in this plan used`,
});

export const showExportLimitDialog = ({
  planExportCountMax,
}) => {
  ConfirmDialog({
    vertical: true,
    type: 'danger',
    title:
          `You have reached the limit of ${planExportCountMax} CSV exports per month on your current plan`,
    message:
          'Upgrade your plan to get unlimited CSV exports per month and take full advantage of this feature',
    confirmButtonText: 'Upgrade plan',
    showCancelButton: false,
  }).then(() => {
    router.push('settings?activeTab=plans');
  });
};
