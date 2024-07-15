import Message from '@/shared/message/message';
import { ErrorMessage } from '../../types/MemberMessage';

export default ({ error }: ErrorMessage) => {
  Message.closeAll();
  if (error.response.status === 404) {
    Message.success('Profiles already merged or deleted', {
      message: `Sorry, the profiles you are trying to merge might have already been merged or deleted.
          Please refresh to see the updated information.`,
    });
    return true;
  }

  Message.error('There was an error merging profiles');
  return false;
};
