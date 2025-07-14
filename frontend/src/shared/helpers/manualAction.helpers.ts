import { MessageStore } from '@/shared/message/notification';

export const doManualAction = async ({
  loadingMessage,
  actionFn,
  successMessage,
  errorMessage,
}: {
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  actionFn: Promise<any>;
}) => {
  if (loadingMessage) {
    MessageStore.info(loadingMessage);
  }

  return actionFn
    .then(() => {
      if (successMessage) {
        MessageStore.closeAll();
        MessageStore.success(successMessage);
      }
      Promise.resolve();
    })
    .catch(() => {
      if (errorMessage) {
        MessageStore.closeAll();
        MessageStore.error(errorMessage);
      }
      Promise.reject();
    });
};
