import { MessageStore } from '@/shared/message/notification';
import { ErrorMessage } from '../../types/MemberMessage';

export default ({ error }: ErrorMessage) => {
  MessageStore.closeAll();
  if (error.response.status === 404) {
    MessageStore.success('Profiles already merged or deleted', {
      message: `Sorry, the profiles you are trying to merge might have already been merged or deleted.
          Please refresh to see the updated information.`,
    });
    return true;
  }

  MessageStore.error('There was an error merging profiles');
  return false;
};
