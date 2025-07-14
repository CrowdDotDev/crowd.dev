import { MessageStore } from '@/shared/message/notification';
import { ApiErrorMessage } from '../../types/OrganizationMessage';

export default ({ error }: ApiErrorMessage) => {
  MessageStore.closeAll();

  if (error.response.status === 404) {
    MessageStore.success('Organizations already merged or deleted', {
      message: `Sorry, the organizations you are trying to merge might have already been merged or deleted.
        Please refresh to see the updated information.`,
    });

    return true;
  }

  MessageStore.error('There was an error merging organizations');
  return false;
};
